const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const ChatMessage = require("./models/ChatMessage");
const Agent = require("./models/Agent");
const Customer = require("./models/Customer");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// After MongoDB connection is established, assign unassigned messages to available agents
mongoose
    .connect("mongodb://127.0.0.1:27017/branch-chat", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(async () => {
        console.log("MongoDB connected");

        // Call assignUnassignedMessages on server start
        await assignUnassignedMessages();
    })
    .catch((error) => console.error("MongoDB connection error:", error));


// Get agent ID (for testing, adjust as needed)
app.get('/agents/getId', (req, res) => {
    const agentId = req.session?.agentId || '6725350a8ba774b02684ee06';
    if (agentId) {
        res.json({ agentId });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// Get all messages
// Get all messages with customer names
app.get("/messages", async (req, res) => {
    try {
        // Fetch all messages
        const messages = await ChatMessage.find();

        // For each message, find the corresponding customer by userID
        const messagesWithCustomerInfo = await Promise.all(
            messages.map(async (message) => {
                const customer = await Customer.findOne({ userID: message.userID });
                return {
                    ...message.toObject(),
                    customerName: customer ? customer.name : 'Unknown',
                };
            })
        );

        res.json(messagesWithCustomerInfo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Get unassigned messages
app.get("/unassigned-messages", async (req, res) => {
    try {
        const messages = await ChatMessage.find({ assignedAgentId: null });
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Search for messages by keyword
app.get("/search/messages", async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: "Keyword is required" });

    try {
        const messages = await ChatMessage.find({
            messageBody: { $regex: keyword, $options: "i" } // Case-insensitive search
        });
        res.json(messages);
    } catch (error) {
        console.error("Error searching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Search for customers by name or email
app.get("/search/customers", async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: "Keyword is required" });

    try {
        const customers = await Customer.find({
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { email: { $regex: keyword, $options: "i" } }
            ]
        });
        res.json(customers);
    } catch (error) {
        console.error("Error searching customers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get customer information by user ID
app.get("/customer/:id", async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.params.id });
        if (!customer) {
            // Instead of returning an error, return an empty object or a specific message
            return res.json({ message: "Customer not found", customer: null });
            // OR to return an empty object instead:
            // return res.json({});
        }
        res.json(customer); // Return the whole customer object
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Assign unassigned messages to available agents
const assignUnassignedMessages = async () => {
    try {

		// Fetch all agents from the database
        const allAgents = await Agent.find({});
        
        // Log all agents to the console
        console.log("All Agents:", allAgents);

        const availableAgents = await Agent.find({ status: "available" });
        const unassignedMessages = await ChatMessage.find({ assignedAgentId: null });
        // Log results for debugging
        console.log("Available Agents:", availableAgents); // Log to see if any agents are fetched
        //console.log("Unassigned Messages:", unassignedMessages); // Log to see unassigned messages

		console.log(unassignedMessages.length);
		console.log(availableAgents.length);
        for (const message of unassignedMessages) {
            if (availableAgents.length === 0) break;

            const assignedAgent = availableAgents.shift();
            message.assignedAgentId = assignedAgent._id;
            await message.save();

            assignedAgent.status = "busy";
            await assignedAgent.save();
        }
    } catch (error) {
        console.error("Error assigning unassigned messages:", error);
    }
};

// Post new customer message
app.post("/messages", async (req, res) => {
    try {
        const { userId, messageBody, priority } = req.body; // Add priority
        if (!userId || !messageBody) {
            return res.status(400).json({ error: "User ID and message body are required" });
        }

        const availableAgent = await Agent.findOne({ status: "available" });
		let assignedAgentId = null; // Initialize assignedAgentId to null

		if (availableAgent) {
			assignedAgentId = availableAgent._id; // Set it to the available agent's ID if one is found
		} else {
			console.log("No available agent");
			// Optionally handle the response here, if needed
			// return res.status(403).json({ error: "No available agents at the moment." });
		}
		
		const chatMessage = new ChatMessage({ userId, messageBody, assignedAgentId, priority }); // Save priority
		await chatMessage.save();

		if (availableAgent) { availableAgent.status = "busy";
        await availableAgent.save();
		}

        res.status(201).json(chatMessage);
    } catch (error) {
        console.error("Error sending message", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


const determineMessagePriority = (messageBody) => {
    const urgentKeywords = ["loan", "payment", "urgent", "refund", "cancellation", "fraud"];
    const lowUrgencyKeywords = ["thank", "good", "fine", "update", "information"];

    if (urgentKeywords.some(keyword => messageBody.toLowerCase().includes(keyword))) {
        return 'high';
    }
    if (lowUrgencyKeywords.some(keyword => messageBody.toLowerCase().includes(keyword))) {
        return 'low';
    }
    return 'medium'; // Default priority if no keywords match
};
// Import messages from CSV
app.post("/import-messages", async (req, res) => {
    const results = [];
    fs.createReadStream('messages.csv')
        .pipe(csv())
        .on('data', (data) => {
            const timestamp = new Date(data['Timestamp (UTC)']);
            results.push({
                userId: data['User ID'],
                timestamp,
                messageBody: data['Message Body']
            });
        })
        .on('end', async () => {
            try {
                for (const msg of results) {
                    // Check for duplicate entries based on userId and messageBody
                    const existingMessage = await ChatMessage.findOne({
                        userId: msg.userId,
                        messageBody: msg.messageBody,
                    });

                    const priority = determineMessagePriority(msg.messageBody);

                    // If the message exists, update its priority; otherwise, create a new entry
                    if (existingMessage) {
                        // Update existing message's priority if it's different
                        if (existingMessage.priority !== priority) {
                            existingMessage.priority = priority;
                            await existingMessage.save();
                        }
                    } else {
                        // Create a new message entry
                        await ChatMessage.create({ ...msg, priority });
                    }
                }

                res.status(201).json({ message: 'Messages imported successfully' });
                await assignUnassignedMessages();  // Auto-assign after import
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Error importing messages' });
            }
        });
});



// Reply to a message
app.put('/messages/:id/reply', async (req, res) => {
    const { id } = req.params;
    const { agentId, responseBody } = req.body;

    if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
        return res.status(400).json({ error: 'Invalid or missing agentId' });
    }

    try {
        const message = await ChatMessage.findById(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.assignedAgentId && message.assignedAgentId.toString() !== agentId) {
            return res.status(403).json({ error: 'You are not assigned to this message.' });
        }

        message.responses.push({ agentId, responseBody });
        await message.save();

        const agent = await Agent.findById(agentId);
        agent.status = "available";
        await agent.save();

        res.json(message);
    } catch (error) {
        console.error("Error sending reply:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update agent status and assign unassigned messages if available
app.put('/agents/:id/update-status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        agent.status = status;
        await agent.save();

        if (status === "available") {
            await assignUnassignedMessages();
        }

        res.json(agent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

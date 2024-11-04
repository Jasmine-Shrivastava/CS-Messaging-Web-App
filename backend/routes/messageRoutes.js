const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");
const Agent = require("../models/Agent");
const Customer = require("../models/Customer");
const fs = require("fs");
const csv = require("csv-parser");
const determineMessagePriority = require("../utils/priority");
const assignUnassignedMessages = require("../utils/assignMessages");

// Import messages from CSV file
router.post("/import-messages", async (req, res) => {
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
                    const existingMessage = await ChatMessage.findOne({
                        userId: msg.userId,
                        messageBody: msg.messageBody,
                    });

                    const priority = determineMessagePriority(msg.messageBody);

                    if (existingMessage) {
                        if (existingMessage.priority !== priority) {
                            existingMessage.priority = priority;
                            await existingMessage.save();
                        }
                    } else {
                        await ChatMessage.create({ ...msg, priority });
                    }
                }
                res.status(201).json({ message: 'Messages imported successfully' });
                await assignUnassignedMessages();
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Error importing messages' });
            }
        });
});


// Create a new message and assign to an agent if available
router.post("/", async (req, res) => {
    try {
        const { userId, messageBody, priority } = req.body;
        if (!userId || !messageBody) {
            return res.status(400).json({ error: "User ID and message body are required" });
        }

        const availableAgent = await Agent.findOne({ status: "available" });
        let assignedAgentId = null;

        if (availableAgent) {
            assignedAgentId = availableAgent._id;
            availableAgent.status = "busy";
            await availableAgent.save();
        }

        const chatMessage = new ChatMessage({ userId, messageBody, assignedAgentId, priority });
        await chatMessage.save();

        res.status(201).json(chatMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch unassigned messages
router.get("/unassigned", async (req, res) => {
    try {
        const unassignedMessages = await ChatMessage.find({ assignedAgentId: null });
        res.json(unassignedMessages);
    } catch (error) {
        console.error("Error fetching unassigned messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Reply to a message
router.put('/:id/reply', async (req, res) => {
    const { id } = req.params;
    const { agentId, responseBody } = req.body;

    if (!agentId) {
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

// Search messages by keyword
router.get("/search", async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: "Keyword is required" });

    try {
        const messages = await ChatMessage.find({
            messageBody: { $regex: keyword, $options: "i" }
        });
        res.json(messages);
    } catch (error) {
        console.error("Error searching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all messages with customer names
router.get("/", async (req, res) => {
    try {
        const messages = await ChatMessage.find();

        const messagesWithCustomerInfo = await Promise.all(
            messages.map(async (message) => {
                const customer = await Customer.findOne({ userId: message.userId });
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

module.exports = router;

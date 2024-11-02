// utils/assignMessages.js
const Agent = require("../models/Agent");
const ChatMessage = require("../models/ChatMessage");

const assignUnassignedMessages = async () => {
    try {
        const availableAgents = await Agent.find({ status: "available" });
        const unassignedMessages = await ChatMessage.find({ assignedAgentId: null });

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

module.exports = assignUnassignedMessages;

// In models/ChatMessage.js
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
    userId: String,
    messageBody: String,
    timestamp: { type: Date, default: Date.now },
    responses: [
        {
            agentId: String,
            responseBody: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
   assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null }, // Add this line
   priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }, // New field for priority
 
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);

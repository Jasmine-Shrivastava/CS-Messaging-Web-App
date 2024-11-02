// models/Agent.js
const mongoose = require("mongoose");

const AgentSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Keep as required
    status: { 
        type: String, 
        enum: ["available", "busy", "offline"], 
        default: "available" 
    },
}, { timestamps: true }); // Automatically manage createdAt and updatedAt

const Agent = mongoose.model("Agent", AgentSchema);
module.exports = Agent;

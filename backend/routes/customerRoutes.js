const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const ChatMessage = require("../models/ChatMessage");

// Get all customers
router.get("/", async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Search for messages by userId
router.get("/search", async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ error: "Keyword is required" });

    try {
        // Find messages where the userId matches the keyword
        const messages = await ChatMessage.find({ userId: keyword });
        
        if (messages.length === 0) {
            return res.status(404).json({ message: "No messages found for the given userId" });
        }

        res.json(messages);
    } catch (error) {
        console.error("Error searching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get customer information by user ID
router.get("/:id", async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.params.id });
        if (!customer) {
            // Instead of returning an error, return an empty object or a specific message
            return res.json({ message: "Customer not found", customer: null });
        }
        res.json(customer); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
module.exports = router;

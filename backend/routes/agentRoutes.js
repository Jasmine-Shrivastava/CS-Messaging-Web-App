// routes/agentRoutes.js
const express = require("express");
const Agent = require("../models/Agent");
const assignUnassignedMessages = require("../utils/assignMessages");

const router = express.Router();

//get agent Id
router.get('/getId', (req, res) => {
    const agentId = req.session?.agentId || '6725350a8ba774b02684ee06';
    res.json({ agentId });
});

//update agent status -(busy or available)
router.put('/:id/update-status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const agent = await Agent.findById(id);
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        agent.status = status;
        await agent.save();

        if (status === "available") await assignUnassignedMessages();

        res.json(agent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;

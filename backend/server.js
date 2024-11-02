// server.js
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const agentRoutes = require("./routes/agentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const customerRoutes = require("./routes/customerRoutes");
const assignUnassignedMessages = require("./utils/assignMessages");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB().then(() => assignUnassignedMessages());

// Routes
app.use("/agents", agentRoutes);
app.use("/messages", messageRoutes);
app.use("/customers", customerRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

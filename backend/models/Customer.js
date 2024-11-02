const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    userId: String,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    // Add any other fields as necessary
});

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;

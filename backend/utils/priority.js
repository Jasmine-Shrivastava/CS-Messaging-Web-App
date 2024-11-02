// utils/priority.js
const determineMessagePriority = (messageBody) => {
    const urgentKeywords = ["loan", "payment", "urgent", "refund", "cancellation", "fraud"];
    const lowUrgencyKeywords = ["thank", "good", "fine", "update", "information"];

    if (urgentKeywords.some(keyword => messageBody.toLowerCase().includes(keyword))) {
        return 'high';
    }
    if (lowUrgencyKeywords.some(keyword => messageBody.toLowerCase().includes(keyword))) {
        return 'low';
    }
    return 'medium';
};

module.exports = determineMessagePriority;

import React, { useEffect, useState, useCallback } from 'react';
import logo from './logo.png';
import CustomerInfoPopup from './CustomerInfoPopup';
// Canned messages array
const cannedMessages = [
    "Hello, How can I assist you today?",
    "Thank you for your inquiry. We will get back to you shortly.",
    "Your request has been received and is being processed.",
    "Please provide more details so we can assist you better.",
    "We appreciate your patience while we work on your request.",
    "For urgent matters, please call our support line at [support phone number]."
];
const MessageRoom = ({ role }) => {
    const [messages, setMessages] = useState([]);
    const [replyMessageId, setReplyMessageId] = useState(null);
    const [agentId, setAgentId] = useState('');
    const [responseBody, setResponseBody] = useState('');
    const [newCustomerMessage, setNewCustomerMessage] = useState('');
    const [messageSearchKeyword, setMessageSearchKeyword] = useState('');
    const [customerSearchKeyword, setCustomerSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);
    const [selectedCannedMessage, setSelectedCannedMessage] = useState('');
    // Fetch the agent ID if logged in as an agent
    const fetchAgentId = useCallback(async () => {
        if (role === "agent") {
            try {
                const response = await fetch('http://localhost:5000/agents/getId');
                const data = await response.json();
                setAgentId(data.agentId); 
            } catch (error) {
                console.error('Error fetching agent ID:', error);
            }
        }
    }, [role]);

    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/messages${role === "agent" ? `?agentId=${agentId}` : ''}`);
            const data = await response.json();
            
            // Sort messages by priority before setting them in state
            data.sort((a, b) => {
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [role, agentId]);

    //fetch customer info
    const fetchCustomerInfo = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5000/customers/${userId}`);
            const data = await response.json();
            if (data.customer === null) {
                console.warn('Customer not found:', data.message);
                setCustomerInfo({});
                setCustomerInfo({});
            } else {
                console.log("customer info fetched");
                setCustomerInfo(data); 
            }
            setShowCustomerInfo(true);
            setShowCustomerInfo(true);
        } catch (error) {
            console.error('Error fetching customer info:', error);
        }
    };
    

    const sendReply = async (messageId) => {
        if (role !== "agent") return;
        const messageToSend = selectedCannedMessage || responseBody; // Use canned message if selected, otherwise responseBody
        try {
            await fetch(`http://localhost:5000/messages/${messageId}/reply`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, responseBody: messageToSend }),
            });
            setResponseBody('');
            setSelectedCannedMessage('');
            setReplyMessageId(null);
            
           // Refresh messages or search results depending on active mode
        if (messageSearchKeyword) {
            searchMessages(); 
        } else if (customerSearchKeyword) {
            searchByCustomers(); 
        } else {
            fetchMessages(); 
        }
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    };
    
    const generateRandomUserId = () => `${Math.floor(1000 + Math.random() * 9000)}`;

    const determineMessagePriority = (messageBody) => {
        const urgentKeywords = ["loan", "Payment", "Urgent", "Refund", "Cancellation", "Fraud"];
        const lowUrgencyKeywords = ["update", "information"];
        
        if (urgentKeywords.some(keyword => messageBody.toLowerCase().includes(keyword))) {
            return 'high';
        }
        if (lowUrgencyKeywords.some(keyword => messageBody.toLowerCase().includes(keyword))) {
            return 'low';
        }
        return 'medium';
    };

    const sendCustomerMessage = async () => {
        if (role !== "customer") return;
        try {
            const userId = generateRandomUserId();
            const priority = determineMessagePriority(newCustomerMessage); // Determine priority based on message
            await fetch('http://localhost:5000/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, messageBody: newCustomerMessage, priority }), // Include priority
            });
            setNewCustomerMessage('');
            fetchMessages();
        } catch (error) {
            console.error('Error sending customer message:', error);
        }
    };

    const importMessages = async () => {
        try {
            const response = await fetch('http://localhost:5000/messages/import-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                fetchMessages(); // Refresh messages after import
                alert('Messages imported successfully!');
            } else {
                alert('Error importing messages.');
            }
        } catch (error) {
            console.error('Error importing messages:', error);
        }
    };

    const searchMessages = async () => {
        if (!messageSearchKeyword) return;
        try {
            const response = await fetch(`http://localhost:5000/messages/search?keyword=${messageSearchKeyword}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching messages:', error);
        }
    };

    const searchByCustomers = async () => {
        if (!customerSearchKeyword) return;
        try {
            const response = await fetch(`http://localhost:5000/customers/search?keyword=${customerSearchKeyword}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    };


    useEffect(() => {
        fetchAgentId();
    }, [fetchAgentId]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    return (
        <div className="chat-room-container">
            <header className="chat-room-header">
                <img src={logo} alt="Company Logo" className="logo" />
                <h1 className="company-name">Branch International</h1>
            </header>
            <h2>{role === "agent" ? "Agent Portal" : "Customer Portal"}</h2>

            {/* Button to import messages */}
            {role === "agent" && (
                <button onClick={importMessages}>Import Messages</button>
            )}

            {/* Search Messages */}
            <div>
                <input
                    type="text"
                    placeholder="Search messages"
                    value={messageSearchKeyword}
                    onChange={(e) => setMessageSearchKeyword(e.target.value)}
                />
                <button onClick={searchMessages}>Search Messages</button>
            </div>

            {/* Search by Customers */}
            <div>
                <input
                    type="text"
                    placeholder="Search by customers ID"
                    value={customerSearchKeyword}
                    onChange={(e) => setCustomerSearchKeyword(e.target.value)}
                />
                <button onClick={searchByCustomers}>Search Customers</button>
            </div>

            <ul>
                {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                        <li key={result._id}>
                            <strong>{result.userId}:</strong> {result.messageBody}
                            <small style={{ color: 'gray', marginLeft: '10px' }}>
                                {result.assignedAgentId ? `(Assigned to Agent ID: ${result.assignedAgentId})` : ''}
                            </small>

                            <span style={{ color: 'lightgray', marginLeft: '10px' }}>
                    {new Date(result.timestamp).toLocaleString()} {/* Format timestamp */}
                </span>

                            <span style={{ color: 'lightgray', marginLeft: '10px' }}>
                    {new Date(result.timestamp).toLocaleString()} {/* Format timestamp */}
                </span>
                            {role === "agent" && (
                    <button onClick={() => fetchCustomerInfo(result.userId)}>View Customer Info</button>
                )}
                            <ul>
                                {result.responses && result.responses.length > 0 ? (
                                    result.responses.map((response, index) => (
                                        <li key={index} className="response">
                                            {response.agentId}: {response.responseBody}
                                            <span style={{ color: 'lightgray', marginLeft: '10px' }}>
                                    {new Date(response.timestamp).toLocaleString()} {/* Format response timestamp */}
                                </span>
                                            <span style={{ color: 'lightgray', marginLeft: '10px' }}>
                                    {new Date(response.timestamp).toLocaleString()} {/* Format response timestamp */}
                                </span>
                                        </li>
                                    ))
                                ) : (
                                    <li>No replies yet.</li>
                                )}
                            </ul>

                            {/* Ensure the reply button is available for filtered messages */}
                            {role === "agent" && (
                                <>
                                    <button onClick={() => setReplyMessageId(result._id)}>Reply</button>
                                    {replyMessageId === result._id && (
                                        <div className="reply-box">
                                            <select
                                                value={selectedCannedMessage}
                                                onChange={(e) => setSelectedCannedMessage(e.target.value)}
                                            >
                                                <option value="">Choose a canned message...</option>
                                                {cannedMessages.map((message, index) => (
                                                    <option key={index} value={message}>
                                                        {message}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Type your reply..."
                                                value={responseBody}
                                                onChange={(e) => setResponseBody(e.target.value)}
                                            />
                                            <button onClick={() => sendReply(result._id)}>Send Reply</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </li>
                    ))
                ) : (
                    messages.map((msg) => (
                        <li key={msg._id}>
                            <strong>{msg.userId}:</strong> {msg.messageBody}
                            <small style={{ color: 'gray', marginLeft: '10px' }}>
                                {msg.assignedAgentId ? `(Assigned to Agent ID: ${msg.assignedAgentId})` : ''}
                            </small>

                            <span style={{ color: 'lightgray', marginLeft: '10px' }}>
                    {new Date(msg.timestamp).toLocaleString()} 
                </span>
                            {role === "agent" && (
                    <button onClick={() => fetchCustomerInfo(msg.userId)}>View Customer Info</button>
                )}
                            <ul>
                                {msg.responses && msg.responses.length > 0 ? (
                                    msg.responses.map((response, index) => (
                                        <li key={index} className="response">
                                            {response.agentId}: {response.responseBody}

                                            <span style={{ color: 'lightgray', marginLeft: '10px' }}>
                                    {new Date(response.timestamp).toLocaleString()} 
                                </span>
                                        </li>
                                    ))
                                ) : (
                                    <li>No replies yet.</li>
                                )}
                            </ul>

                            {role === "agent" && (
                                <>
                                    <button onClick={() => setReplyMessageId(msg._id)}>Reply</button>
                                    {replyMessageId === msg._id && (
                                        <div className="reply-box">
                                            <select
                                                value={selectedCannedMessage}
                                                onChange={(e) => setSelectedCannedMessage(e.target.value)}
                                            >
                                                <option value="">Choose a canned message...</option>
                                                {cannedMessages.map((message, index) => (
                                                    <option key={index} value={message}>
                                                        {message}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Type your reply..."
                                                value={responseBody}
                                                onChange={(e) => setResponseBody(e.target.value)}
                                            />
                                            <button onClick={() => sendReply(msg._id)}>Send Reply</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </li>
                    ))
                )}
            </ul>

            {/* If customer info is being shown, render the popup */}
            {showCustomerInfo && (
                <CustomerInfoPopup 
                    customer={customerInfo} 
                    onClose={() => setShowCustomerInfo(false)} 
                />
            )}

{role === "customer" && (
                <div className="customer-message-form">
                    <h3>Send a Customer Message</h3>
                    <input
                        type="text"
                        placeholder="Enter customer message"
                        value={newCustomerMessage}
                        onChange={(e) => setNewCustomerMessage(e.target.value)}
                    />
                    <button onClick={sendCustomerMessage}>Send Message</button>
                </div>
            )}
        </div>
    );
};

export default MessageRoom;

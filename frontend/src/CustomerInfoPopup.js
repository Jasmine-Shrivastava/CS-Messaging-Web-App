import React from 'react';

const CustomerInfoPopup = ({ customer, onClose }) => {
    if (!customer) return null;

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <h2>Customer Information</h2>
                <p><strong>Name:</strong> {customer.name}</p>
                <p><strong>Email:</strong> {customer.email}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default CustomerInfoPopup;

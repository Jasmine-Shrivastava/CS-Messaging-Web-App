// src/RoleSelection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = ({ setRole }) => {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    setRole(role);
    navigate("/chat"); // Navigate to the chat room
  };

  return (
    <div className="role-selection-container">
      <h2>Select your role</h2>
      <button onClick={() => handleRoleSelection("customer")}>Customer</button>
      <button onClick={() => handleRoleSelection("agent")}>Agent</button>
    </div>
  );
};

export default RoleSelection;

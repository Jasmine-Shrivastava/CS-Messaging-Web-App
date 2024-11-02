// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelection from './RoleSelection';
import MessageRoom from './MessageRoom';
import './App.css';

function App() {
  const [role, setRole] = useState('');

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<RoleSelection setRole={setRole} />} />
          <Route path="/chat" element={<MessageRoom role={role} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

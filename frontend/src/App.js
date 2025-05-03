// src/App.js
import React from 'react';
import ThemeToggle from './ThemeToggle';
import ChatApp from './ChatApp';    // ← import your wrapper
import './chatApp.css';

function App() {
  return (
    <div className="app">
      <ThemeToggle />
      <ChatApp />                   {/* ← render only ChatApp */}
    </div>
  );
}

export default App;

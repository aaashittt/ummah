// --------- src/App.js ---------
import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import ChatHistory from './ChatHistory';
import ChatWindow from './ChatWindow';
import './chatApp.css';

function App() {
  const [currentChatId, setCurrentChatId] = useState(null);

  return (
    <div className="app">
      <ThemeToggle />
      <div className="main">
        <ChatHistory onSelectChat={setCurrentChatId} currentChatId={currentChatId} />
        <ChatWindow chatId={currentChatId} />
      </div>
    </div>
  );
}

export default App;


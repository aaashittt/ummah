// App.js or main entry point
import React, { useState, useEffect } from 'react';
import ChatApp from './ChatApp';
import ChatHistory from './ChatHistory';
import ThemeToggle from './ThemeToggle';
import './chatApp.css';

function App() {
  const [currentChatId, setCurrentChatId] = useState(null);

  return (
    <div className="app">
      <ThemeToggle />
      <div className="layout">
        <ChatHistory onSelectConversation={setCurrentChatId} />
        <ChatApp chatId={currentChatId} />
      </div>
    </div>
  );
}

export default App;

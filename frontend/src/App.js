// src/App.js
import React, { useState } from 'react';
import ChatHistory from './ChatHistory';
import ChatApp from './ChatApp';
import ThemeToggle from './ThemeToggle';
import './chatApp.css';    // <-- must be here (or in your index.js)

function App() {
  const [currentChatId, setCurrentChatId] = useState(null);

  return (
    <div className="app">
      <ThemeToggle />     {/* now you’ll see the button */}
      <div className="layout">
        <ChatHistory onSelectConversation={setCurrentChatId} />
        <ChatApp chatId={currentChatId} />
      </div>
    </div>
  );
}

export default App;

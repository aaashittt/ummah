// src/ChatApp.js
import React, { useState } from 'react';
import ChatHistory from './ChatHistory';
import ChatWindow from './ChatWindow';
import './chatApp.css';

export default function ChatApp() {
  const [currentChatId, setCurrentChatId] = useState(null);

  return (
    <div className="chat-app">             {/* top‐level container */}
      <ChatHistory
        onSelectChat={setCurrentChatId}
        currentChatId={currentChatId}
      />
      <ChatWindow chatId={currentChatId} />
    </div>
  );
}

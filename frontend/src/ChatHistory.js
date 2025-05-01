// --------- src/ChatHistory.js ---------
import React, { useEffect, useState } from 'react';

function ChatHistory({ onSelectChat, currentChatId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('chatHistory')) || [];
    setHistory(stored);
  }, []);

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Chats</h2>
      <ul className="chat-list">
        {history.map(chat => (
          <li
            key={chat.id}
            className={`chat-list-item ${chat.id === currentChatId ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            {chat.heading}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatHistory;
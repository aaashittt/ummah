import React, { useState, useEffect } from 'react';

function ChatHistory({ onSelectConversation }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('chatHistory')) || [];
    setHistory(stored);
  }, []);

  return (
    <div className="chat-history">
      <h2>Chats</h2>
      <ul>
        {history.map(chat => (
          <li key={chat.id} onClick={() => onSelectConversation(chat.id)}>
            {chat.heading}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatHistory;

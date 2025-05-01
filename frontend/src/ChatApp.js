// ChatApp.js
import React, { useState } from 'react';
import './ChatApp.css';

const backendUrl = 'https://your-backend-url.onrender.com'; // Replace with your actual URL

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    const botMessage = { text: 'Thinking...', sender: 'bot' };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInput('');
    setError('');

    try {
      const res = await fetch(`${backendUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });

      const data = await res.json();
      const updatedMessages = [...messages, userMessage, { text: `Bot: ${data.answer || "No response"}`, sender: 'bot' }];
      setMessages(updatedMessages);
    } catch (err) {
      setError('Bot: Service unavailable. Please try later.');
    }
  };

  return (
    <div className="chat-container">
      <h1>Ummah AI Chat</h1>
      <div id="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender === 'user' ? 'user-message' : 'bot-message'}>
            {msg.sender === 'user' ? `You: ${msg.text}` : msg.text}
          </div>
        ))}
      </div>

      <div className="input-group">
        <input
          id="question-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button id="send-button" onClick={sendMessage}>Send</button>
      </div>

      {error && <div id="error-message">{error}</div>}
    </div>
  );
}

export default ChatApp;

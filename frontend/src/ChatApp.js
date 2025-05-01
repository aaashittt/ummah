// ChatApp.js
import React, { useState } from 'react';
import './chatApp.css';

const backendUrl = 'https://ummah2.onrender.com'; // Replace with your actual backend URL

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = {
      sender: 'user',
      text: trimmedInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsBotTyping(true);

    try {
      const response = await fetch(`${backendUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedInput }),
      });

      const data = await response.json();

      const botMessage = {
        sender: 'bot',
        text: data.answer || 'No response received',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Bot: Service unavailable. Please try later.' },
      ]);
      console.error('Fetch error:', error);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chat-container dark-mode">
      <div className="chat-header">💬 SmartChat</div>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}
          >
            <div className="avatar">
              {msg.sender === 'user' ? '🧑' : '🤖'}
            </div>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
        {isBotTyping && (
          <div className="message-row bot">
            <div className="avatar">🤖</div>
            <div className="message-bubble typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatApp;

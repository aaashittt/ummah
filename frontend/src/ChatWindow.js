// src/ChatWindow.js
import React, { useState, useEffect, useRef } from 'react';
import './chatApp.css';

const backendUrl = 'https://ummah2.onrender.com';

export default function ChatWindow({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Load history whenever chat changes
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const chat = stored.find(c => c.id === chatId);
    setMessages(chat ? chat.messages : []);
  }, [chatId]);

  // Auto‑scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist back to localStorage
  const saveHistory = msgs => {
    const heading = msgs[1]?.text.slice(0, 20) || 'Chat';
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const idx = history.findIndex(c => c.id === chatId);
    const id  = chatId || Date.now().toString();

    if (idx >= 0) history[idx] = { id, heading, messages: msgs };
    else           history.push({ id, heading, messages: msgs });

    localStorage.setItem('chatHistory', JSON.stringify(history));
  };

  // Send to backend
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const { reply } = await res.json();
      const botMsg = { from: 'bot', text: reply || '…' };
      const final = [...updated, botMsg];
      setMessages(final);
      saveHistory(final);
    } catch {
      setMessages([...updated, { from: 'bot', text: 'Service unavailable.' }]);
    }
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.from}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <textarea
          className="message-input"
          placeholder="Type your message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

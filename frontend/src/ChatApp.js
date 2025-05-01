// ChatApp.js
import React, { useState, useEffect } from 'react';
import './chatApp.css';
const backendUrl = 'https://ummah2.onrender.com';

function ChatApp({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const current = storedHistory.find(chat => chat.id === chatId);
    if (current) setMessages(current.messages);
  }, [chatId]);

  const saveToHistory = (newMessages) => {
    const heading = newMessages[0]?.text?.slice(0, 20) || 'Chat';
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const index = history.findIndex(chat => chat.id === chatId);

    if (index >= 0) {
      history[index] = { id: chatId, heading, messages: newMessages };
    } else {
      history.push({ id: chatId || Date.now().toString(), heading, messages: newMessages });
    }

    localStorage.setItem('chatHistory', JSON.stringify(history));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      const updatedMessages = [...newMessages, { from: 'bot', text: data.reply || 'Error' }];
      setMessages(updatedMessages);
      saveToHistory(updatedMessages);
    } catch {
      setMessages([...newMessages, { from: 'bot', text: 'Service unavailable. Please try again later.' }]);
    }
  };

  return (
    <div className="chat-app">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.from}`}>{msg.text}</div>
        ))}
      </div>
      <div className="input-area">
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatApp;
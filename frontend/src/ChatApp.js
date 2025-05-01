import React, { useState, useEffect } from 'react';
import './chatApp.css';

const backendUrl = 'https://ummah2.onrender.com';

function ChatApp({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // load history when chatId changes
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const current = stored.find(c => c.id === chatId);
    if (current) setMessages(current.messages);
    else setMessages([]);
  }, [chatId]);

  const saveToHistory = (newMessages) => {
    const heading = newMessages[0]?.text.slice(0, 20) || 'Chat';
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const idx = history.findIndex(c => c.id === chatId);

    if (idx >= 0) {
      history[idx] = { id: chatId, heading, messages: newMessages };
    } else {
      history.push({ id: chatId || Date.now().toString(), heading, messages: newMessages });
    }

    localStorage.setItem('chatHistory', JSON.stringify(history));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const { reply } = await res.json();
      const botMsg = { from: 'bot', text: reply || 'Error' };
      const updated = [...newMsgs, botMsg];
      setMessages(updated);
      saveToHistory(updated);
    } catch {
      setMessages([...newMsgs, { from: 'bot', text: 'Service unavailable.' }]);
    }
  };

  return (
    <div className="chat-app">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.from}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatApp;

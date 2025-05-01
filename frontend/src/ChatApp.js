import "./chatApp.css";
// src/ChatApp.js
import React, { useState } from "react";
import "./ChatApp.css"; // Optional: move your styles here

const backendUrl = "https://your-render-app.onrender.com"; // UPDATE THIS AFTER DEPLOYMENT

const ChatApp = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    const userText = input.trim();
    if (!userText) return;

    // Add user message and placeholder bot message
    const userMessage = { sender: "user", text: `You: ${userText}` };
    const botPlaceholder = { sender: "bot", text: "Bot: Thinking..." };

    const updatedMessages = [...messages, userMessage, botPlaceholder];
    setMessages(updatedMessages);
    setInput("");

    try {
      const response = await fetch(`${backendUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = {
        sender: "bot",
        text: `Bot: ${data.answer || "No response received"}`,
      };

      // Replace the placeholder with actual bot response
      const newMessages = [...messages, userMessage, botResponse];
      setMessages(newMessages);
    } catch (error) {
      const errorMsg = {
        sender: "bot",
        text: "Bot: Service unavailable. Please try later.",
      };
      const newMessages = [...messages, userMessage, errorMsg];
      setMessages(newMessages);
      console.error("Fetch Error:", error);
    }
  };

  return (
    <div>
      <h1>Chat with AI</h1>
      <div id="chat-window">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.sender === "user" ? "user-message" : "bot-message"}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <input
        id="question-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your question..."
      />
      <button id="send-button" onClick={sendMessage}>
        Send
      </button>
    </div>
  );
};

export default ChatApp;

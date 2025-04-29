const backendUrl = 'https://your-render-app.onrender.com'; // UPDATE THIS AFTER DEPLOYMENT
const sendButton = document.getElementById("send-button");
const input = document.getElementById("question-input");
const chatWindow = document.getElementById("chat-window");

sendButton.addEventListener("click", async () => {
  const userText = input.value.trim();
  if (!userText) return;

  // Add messages to chat
  const userMessage = document.createElement("div");
  userMessage.className = "user-message";
  userMessage.textContent = `You: ${userText}`;
  
  const botMessage = document.createElement("div");
  botMessage.className = "bot-message";
  botMessage.textContent = "Bot: Thinking...";
  
  chatWindow.append(userMessage, botMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = "";

  try {
    const response = await fetch(`${backendUrl}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: userText })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    botMessage.textContent = `Bot: ${data.answer || "No response received"}`;
  } catch (error) {
    botMessage.textContent = "Bot: Service unavailable. Please try later.";
    console.error("Fetch Error:", error);
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
});
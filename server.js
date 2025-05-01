import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import dns from 'node:dns';

// Force IPv4 DNS resolution for Render compatibility
dns.setDefaultResultOrder('ipv4first');

// Environment configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware setup
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: "Invalid JSON format" });
      throw new Error("Invalid JSON");
    }
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = await fetch('https://api.openrouter.ai', { method: 'HEAD' });
    res.status(healthCheck.ok ? 200 : 500).json({
      status: healthCheck.ok ? 'healthy' : 'unhealthy',
      openrouter: healthCheck.status
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Main API endpoint with enhanced error handling
app.post('/ask', async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    if (!req.body?.question?.trim()) {
      return res.status(400).json({ error: "Question field is required" });
    }

    const response = await fetch("https://api.openrouter.ai/v1/chat/completions", {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
        'X-Title': 'AI Chatbot'
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: req.body.question.trim() }],
        temperature: 0.7
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      return res.status(502).json({ 
        error: "AI service unavailable",
        details: process.env.NODE_ENV === 'production' ? null : errorText
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    
    if (answer) {
      return res.json({ answer });
    }
    
    console.error("Unexpected Response Format:", data);
    res.status(500).json({ error: "AI service returned unexpected response" });
  } catch (error) {
    clearTimeout(timeout);
    console.error("Server Error:", error);
    
    const errorMessage = error.name === 'AbortError' 
      ? "Request timed out" 
      : error.message.includes('ENOTFOUND')
        ? "Failed to connect to AI service"
        : "Internal server error";

    res.status(500).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Server initialization
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  Server running on port: ${PORT}
  CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5500'}
  Environment: ${process.env.NODE_ENV || 'development'}
  DNS Mode: ${dns.getDefaultResultOrder()}
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down gracefully...');
  process.exit(0);
});
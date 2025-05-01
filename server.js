import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced security middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware setup
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

// Enhanced JSON parsing with error handling
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

// Pre-flight requests
app.options('/ask', cors());

// API Endpoint with improved error handling
app.post('/ask', async (req, res) => {
  try {
    // Validate request body
    if (!req.body?.question) {
      return res.status(400).json({ error: "Question field is required" });
    }

    // OpenRouter API call
    const response = await fetch("https://api.openrouter.ai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
        'X-Title': 'AI Chatbot'
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: req.body.question }],
        temperature: 0.7
      })
    });

    // Handle OpenRouter API errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'AI service error' 
      });
    }

    const data = await response.json();
    
    if (data.choices?.[0]?.message?.content) {
      res.json({ answer: data.choices[0].message.content });
    } else {
      console.error("Unexpected API Response:", data);
      res.status(500).json({ error: "AI service returned unexpected format" });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Something went wrong!' 
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nServer shutting down...');
  process.exit();
});

// Critical fix: Added '0.0.0.0' for Render compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5500'}`);
});
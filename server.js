import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import dns from 'node:dns';
import { Agent } from 'node:https';

// DNS Configuration
dns.setDefaultResultOrder('ipv4first');
const dnsAgent = new Agent({ 
  family: 4, // Force IPv4
  keepAlive: true,
  rejectUnauthorized: true
});

// Environment setup
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware pipeline
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

// Health endpoints
app.get('/health', async (req, res) => {
  try {
    const healthCheck = await fetch('https://api.openrouter.ai', { 
      method: 'HEAD',
      agent: dnsAgent
    });
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

// AI API endpoint with enhanced networking
app.post('/ask', async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    if (!req.body?.question?.trim()) {
      return res.status(400).json({ error: "Question field is required" });
    }

    const response = await fetch("https://api.openrouter.ai/v1/chat/completions", {
      agent: dnsAgent, // Critical DNS fix
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
      const errorData = await response.json();
      console.error('OpenRouter API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'AI service error',
        details: process.env.NODE_ENV === 'production' ? null : errorData
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    
    return answer 
      ? res.json({ answer })
      : res.status(500).json({ error: "AI returned empty response" });

  } catch (error) {
    clearTimeout(timeout);
    console.error("Server Error:", error);

    const errorResponse = {
      error: "Internal server error",
      ...(process.env.NODE_ENV !== 'production' && { 
        details: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      })
    };

    res.status(500).json(errorResponse);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
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
  SSL Certificates: ${process.env.NODE_EXTRA_CA_CERTS ? 'Configured' : 'Missing'}
  `);
});

app.get('/ssl-check', (req, res) => {
  res.json({
    sslPath: process.env.NODE_EXTRA_CA_CERTS,
    certsExist: require('fs').existsSync(process.env.NODE_EXTRA_CA_CERTS)
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down gracefully...');
  process.exit(0);
});
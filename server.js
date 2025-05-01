import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import dns from 'node:dns';
import { Agent } from 'node:https';
import { lookup } from 'node:dns/promises';
import fs from 'fs';

// =====================
// DNS/IP Configuration
// =====================
dns.setDefaultResultOrder('ipv4first');
const dnsAgent = new Agent({ 
  family: 4,
  keepAlive: true,
  rejectUnauthorized: true,
  servername: 'api.openrouter.ai' // Critical SSL fix
});

let OPENROUTER_IP = '172.67.74.72'; // Fallback IP
const OPENROUTER_HOST = 'api.openrouter.ai';

// Periodically resolve DNS
async function resolveOpenRouter() {
  try {
    const { address } = await lookup(OPENROUTER_HOST, { family: 4 });
    OPENROUTER_IP = address;
    console.log(`✅ Resolved ${OPENROUTER_HOST} to IP: ${OPENROUTER_IP}`);
  } catch (error) {
    console.error(`❌ DNS Resolution Failed: ${error.message}`);
    console.log(`⚠️ Using fallback IP: ${OPENROUTER_IP}`);
  }
}

// ================
// Server Setup
// ================
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
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

// ================
// API Endpoints
// ================
app.get('/health', async (req, res) => {
  try {
    const response = await fetch(`https://${OPENROUTER_IP}`, { // Changed to HTTPS
      method: 'HEAD',
      agent: dnsAgent,
      headers: { 'Host': OPENROUTER_HOST }
    });
    res.status(response.ok ? 200 : 500).json({
      status: response.ok ? 'healthy' : 'unhealthy',
      ip: OPENROUTER_IP,
      dnsResolved: OPENROUTER_IP !== '172.67.74.72'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      ipUsed: OPENROUTER_IP
    });
  }
});

app.post('/ask', async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    if (!req.body?.question?.trim()) {
      return res.status(400).json({ error: "Question field is required" });
    }

    const response = await fetch(`https://${OPENROUTER_IP}/v1/chat/completions`, { // Changed to HTTPS
      agent: dnsAgent,
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Host': OPENROUTER_HOST,
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
      console.error('OpenRouter Error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'AI service error',
        ipUsed: OPENROUTER_IP,
        ...(process.env.NODE_ENV !== 'production' && { details: errorData })
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    
    return answer 
      ? res.json({ answer, ipUsed: OPENROUTER_IP })
      : res.status(500).json({ error: "AI returned empty response" });

  } catch (error) {
    clearTimeout(timeout);
    console.error("Server Error:", error);
    
    const errorResponse = {
      error: error.name === 'AbortError' ? "Request timeout" : "Internal error",
      ipUsed: OPENROUTER_IP,
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

// ==================
// Server Management
// ==================
// Initial DNS resolution
resolveOpenRouter();
// Hourly DNS updates
setInterval(resolveOpenRouter, 3600000);

app.get('/ssl-check', (req, res) => {
  const certPath = process.env.NODE_EXTRA_CA_CERTS;
  res.json({
    sslConfigured: !!certPath,
    certsExist: certPath ? fs.existsSync(certPath) : false,
    certPath
  });
});

app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  Server running on port: ${PORT}
  CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5500'}
  Environment: ${process.env.NODE_ENV || 'development'}
  DNS Mode: ${dns.getDefaultResultOrder()}
  OpenRouter IP: ${OPENROUTER_IP}
  `);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down gracefully...');
  process.exit(0);
});
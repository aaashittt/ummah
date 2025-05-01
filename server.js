import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

dotenv.config();
const app = express();

// 🔌 Dynamic port binding
const PORT = parseInt(process.env.PORT, 10) || 3000;

// 🛡️ Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 100,                    // limit each IP
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// ——— Middleware ———
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} • ${req.method} ${req.url}`);
  next();
});
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'  // adjust to your frontend URL
}));
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

// ——— Health checks ———
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ——— Chat endpoint ———
app.post('/ask', async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const question = req.body?.question?.trim();
    if (!question) {
      return res.status(400).json({ error: 'Question field is required' });
    }

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'AI Chatbot'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct',
          messages: [{ role: 'user', content: question }],
          temperature: 0.7
        })
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.json();
      console.error('OpenRouter Error:', err);
      return res.status(response.status).json({
        error: err.error?.message || 'AI service error',
        ...(process.env.NODE_ENV !== 'production' && { details: err })
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(500).json({ error: 'AI returned empty response' });
    }
    res.json({ answer });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Server Error:', error);
    res.status(500).json({
      error: error.name === 'AbortError' ? 'Request timeout' : 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

// ——— SSL-check endpoint ———
app.get('/ssl-check', (req, res) => {
  const certPath = process.env.NODE_EXTRA_CA_CERTS;
  res.json({
    sslConfigured: !!certPath,
    certsExist: certPath ? fs.existsSync(certPath) : false,
    certPath
  });
});

// ——— Global error handler ———
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// 🏁 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port: ${PORT}`);
});

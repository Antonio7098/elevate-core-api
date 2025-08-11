// src/server-ultra-minimal.ts - Ultra-minimal TypeScript server without dotenv
import express from 'express';

const PORT = 3000;

// Create minimal Express app
const app = express();

// Simple test route
app.get('/ping', (req, res) => {
  console.log('🔥 PING route hit - Express is working!');
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ultra-minimal TypeScript server is running on port ${PORT}`);
  console.log(`📖 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/ping`);
  console.log(`   - http://localhost:${PORT}/health`);
});

console.log('✅ Ultra-minimal TypeScript server setup complete');


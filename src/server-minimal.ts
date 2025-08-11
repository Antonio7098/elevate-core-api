// src/server-minimal.ts - Minimal server to isolate hanging issue
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Create minimal Express app
const app = express();

// Basic middleware
app.use(express.json());

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
  console.log(`🚀 Minimal server is running on port ${PORT}`);
  console.log(`📖 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/ping`);
  console.log(`   - http://localhost:${PORT}/health`);
});

console.log('✅ Minimal server setup complete');


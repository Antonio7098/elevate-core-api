// server-ultra-minimal.js - Ultra-minimal server using plain JavaScript
const express = require('express');

const PORT = process.env.PORT || 3000;

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
  console.log(`🚀 Ultra-minimal server is running on port ${PORT}`);
  console.log(`📖 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/ping`);
  console.log(`   - http://localhost:${PORT}/health`);
});

console.log('✅ Ultra-minimal server setup complete');


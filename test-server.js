const express = require('express');
const app = express();

// Simple test route
app.get('/ping', (req, res) => {
  console.log('Ping route hit');
  res.json({ message: 'pong' });
});

// Test API route
app.get('/api/test', (req, res) => {
  console.log('API test route hit');
  res.json({ message: 'API working' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

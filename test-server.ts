// Minimal test server to isolate hang issue
import express from 'express';

const app = express();
const PORT = 3001;

app.get('/ping', (req, res) => {
  console.log('🔥 PING route hit - Express is working!');
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server is running on port ${PORT}`);
  console.log(`📖 Test endpoint available at http://localhost:${PORT}/ping`);
});

// src/server.ts
import app from './app';
import dotenv from 'dotenv';

// Load environment variables (if not already loaded by app.ts, though it should be)
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server with AI API client initialization
async function startServer() {
  try {
    // Initialize AI API client before starting the server
    const { initializeApplication } = await import('./app');
    await initializeApplication();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

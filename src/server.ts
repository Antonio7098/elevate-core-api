// src/server.ts
import app from './app';
import dotenv from 'dotenv';

// Load environment variables (if not already loaded by app.ts, though it should be)
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server with non-blocking AI API client initialization
async function startServer() {
  try {
    // Start the Express server first
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
    });
    
    // Initialize AI API client asynchronously after server starts
    console.log('🔄 Starting AI API client initialization in background...');
    const { initializeApplication } = await import('./app');
    initializeApplication()
      .then(() => {
        console.log('✅ AI API client initialization completed successfully');
      })
      .catch((error) => {
        console.error('⚠️ AI API client initialization failed, but server is still running:', error);
      });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

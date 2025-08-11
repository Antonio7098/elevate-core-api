// src/server-minimal-app.ts - Minimal server using minimal app
import app from './app-minimal';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server with minimal app
async function startServer() {
  try {
    // Start the Express server first
    app.listen(PORT, () => {
      console.log(`🚀 Minimal server is running on port ${PORT}`);
      console.log(`📖 Test endpoints:`);
      console.log(`   - http://localhost:${PORT}/ping`);
      console.log(`   - http://localhost:${PORT}/health`);
      console.log(`   - http://localhost:${PORT}/test`);
    });
    
    // Initialize minimal application
    console.log('🔄 Starting minimal application initialization...');
    const { initializeApplication } = await import('./app-minimal');
    initializeApplication()
      .then(() => {
        console.log('✅ Minimal application initialization completed successfully');
      })
      .catch((error) => {
        console.error('⚠️ Minimal application initialization failed:', error);
      });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();


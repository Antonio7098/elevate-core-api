// src/server-debug.ts - Debug server using minimal app
import app from './app-debug';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server with debug app
async function startServer() {
  try {
    // Start the Express server first
    app.listen(PORT, () => {
      console.log(`🚀 Debug server is running on port ${PORT}`);
      console.log(`📖 Test endpoints:`);
      console.log(`   - http://localhost:${PORT}/ping`);
      console.log(`   - http://localhost:${PORT}/health`);
      console.log(`   - http://localhost:${PORT}/api/auth/login`);
    });
    
    // Initialize minimal application
    console.log('🔄 Starting debug application initialization...');
    const { initializeApplication } = await import('./app-debug');
    initializeApplication()
      .then(() => {
        console.log('✅ Debug application initialization completed successfully');
      })
      .catch((error) => {
        console.error('⚠️ Debug application initialization failed:', error);
      });
    
  } catch (error) {
    console.error('❌ Failed to start debug server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

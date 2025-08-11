// src/app-minimal.ts - Minimal app to isolate hanging route imports
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth'; // Add auth router
import userRouter from './routes/user.routes'; // Add user router
import folderRouter from './routes/folder.routes'; // Add folder router
import reviewMinimalRouter from './routes/review-minimal'; // Add minimal review router
import questionRouter from './routes/question.routes'; // Add question router

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
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

// Emergency test route (before any middleware)
app.get('/test', (req: express.Request, res: express.Response) => {
  console.log('🔥 TEST route hit - Express is working!');
  res.json({ status: 'test', timestamp: new Date().toISOString() });
});

// Basic request logging
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`🌐 [SERVER] INCOMING REQUEST: ${req.method} ${req.url}`);
  next();
});

// Add auth routes
app.use('/api/auth', authRouter);

// Add user routes
app.use('/api/users', userRouter);

// Add folder routes
app.use('/api/folders', folderRouter);

// Add minimal review routes
app.use('/api/reviews', reviewMinimalRouter);

// Add question routes
app.use('/api/questions', questionRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

async function initializeApplication() {
  try {
    console.log('🚀 Initializing minimal application...');
    console.log('✅ Minimal application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
  }
}

export { app, initializeApplication };
export default app;

// Main application file
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma'; // Import shared prisma instance
import { authRouter } from './routes/auth'; 
import userRouter from './routes/user.routes';
import folderRouter from './routes/folder.routes';
import aiRouter from './routes/ai.routes';
import reviewRouter from './routes/review.routes';
import evaluationRouter from './routes/evaluation.routes';
import standaloneQuestionSetRouter from './routes/standalone-questionset.routes';
import standaloneQuestionRouter from './routes/standalone-question.routes';
import dashboardRouter from './routes/dashboard.routes';
import todaysTasksRoutes from './routes/todaysTasks.routes';
import statsRouter from './routes/stats.routes';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/folders', folderRouter);
app.use('/api/ai', aiRouter); // Note: /api/ai is used twice, ensure this is intended or consolidate
app.use('/api/reviews', reviewRouter);
app.use('/api/ai', evaluationRouter); // Second use of /api/ai
app.use('/api/dashboard', dashboardRouter);
app.use('/api/todays-tasks', todaysTasksRoutes);
app.use('/api/stats', statsRouter);

// Additional standalone routes for direct access
app.use('/api/questionsets', standaloneQuestionSetRouter);
app.use('/api/questions', standaloneQuestionRouter);


// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err.stack); // Log the full error
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

export default app;

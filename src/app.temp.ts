// Main application file
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth.ts';
import userRouter from './routes/user.routes.ts';
import folderRouter from './routes/folder.routes.ts';
import aiRouter from './routes/ai.routes.ts';
import reviewRouter from './routes/review.routes.ts';
import evaluationRouter from './routes/evaluation.routes.ts';
import standaloneQuestionSetRouter from './routes/standalone-questionset.routes.ts';
import standaloneQuestionRouter from './routes/standalone-question.routes.ts';
import questionSetQuestionsRouter from './routes/temp/question-set-questions.routes';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/folders', folderRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/ai', evaluationRouter);

// Additional standalone routes for direct access
app.use('/api/questionsets', standaloneQuestionSetRouter);
app.use('/api/questions', standaloneQuestionRouter);

// New route for Question Set Questions
app.use('/api/questionsets', questionSetQuestionsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;

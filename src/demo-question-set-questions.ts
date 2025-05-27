import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

// Initialize Express app and Prisma client
const app = express();
const prisma = new PrismaClient();
const PORT = 3333; // Use a different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Simple authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Get all questions for a specific question set
 * This endpoint is protected and only returns questions for sets owned by the authenticated user
 * GET /api/questionsets/:id/questions
 */
app.get('/api/questionsets/:id/questions', authenticate, async (req: any, res: any) => {
  const questionSetId = req.params.id;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!questionSetId || isNaN(parseInt(questionSetId))) {
    return res.status(400).json({ message: 'Invalid question set ID provided' });
  }

  try {
    // Verify the question set exists and belongs to the user
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: parseInt(questionSetId),
        folder: {
          userId: userId,
        },
      },
    });

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found or access denied' });
    }

    // Get all questions for this question set
    const questions = await prisma.question.findMany({
      where: {
        questionSetId: parseInt(questionSetId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json({
      questionSet: {
        id: questionSet.id,
        name: questionSet.name,
        folderId: questionSet.folderId
      },
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        questionType: q.questionType,
        answer: q.answer,
        options: q.options,
        learningStage: q.learningStage,
        conceptTags: q.conceptTags,
        difficultyScore: q.difficultyScore,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching questions by question set ID:', error);
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Demo server running on port ${PORT}`);
  console.log(`API endpoint available at: http://localhost:${PORT}/api/questionsets/:id/questions`);
  console.log('To test, use a request with a valid JWT token in the Authorization header:');
  console.log('curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3333/api/questionsets/1/questions');
});

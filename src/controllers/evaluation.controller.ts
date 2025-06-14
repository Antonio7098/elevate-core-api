import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { aiService } from '../services/aiService';

interface EvaluateAnswerRequest {
  questionId: string;
  answer: string;
}

export async function evaluateAnswer(
  request: Request,
  response: Response
) {
  const { questionId, answer } = request.body;
  
  if (!request.user?.userId) {
    response.status(401).send({ error: 'Unauthorized' });
    return;
  }
  
  const userId = request.user.userId;

  // Get the question and verify ownership
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      questionSet: {
        include: {
          folder: true
        }
      }
    }
  });

  if (!question) {
    response.status(404).send({ error: 'Question not found' });
    return;
  }

  if (!question.questionSet?.folder) {
    response.status(404).send({ error: 'Question set or folder not found' });
    return;
  }

  if (question.questionSet.folder.userId !== userId) {
    response.status(404).send({ error: 'Question not found' });
    return;
  }

  // Route based on question type
  if (question.autoMark) {
    if (!question.answer) {
      response.status(400).send({ error: 'Question has no answer set' });
      return;
    }
    const score = answer.trim().toLowerCase() === question.answer.trim().toLowerCase() ? 1.0 : 0.0;
    response.send({ score });
    return;
  }

  if (question.selfMark) {
    response.send({ requiresSelfMark: true });
    return;
  }

  // AI evaluation
  const result = await aiService.evaluateAnswer({
    questionContext: {
      questionId: question.id,
      questionText: question.text,
      expectedAnswer: question.answer || undefined,
      questionType: question.questionType,
      options: question.options
    },
    userAnswer: answer
  });

  response.send(result);
} 
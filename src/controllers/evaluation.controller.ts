/**
 * Evaluation Controller
 * 
 * This controller handles AI-powered evaluation of user answers to questions.
 * It integrates with the AI service for intelligent marking and feedback,
 * and updates the spaced repetition data based on the evaluation results.
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/aiService';
import { EvaluateAnswerRequest } from '../types/ai-service.types';
import { calculateNextReview } from '../services/spacedRepetition.service';

const prisma = new PrismaClient();

/**
 * Evaluate a user's answer to a question using AI
 * POST /api/ai/evaluate-answer
 */
export const evaluateAnswer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { questionId, userAnswer, updateMastery = true } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Retrieve the question and verify ownership
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        questionSet: {
          folder: {
            userId: userId
          }
        }
      },
      include: {
        questionSet: {
          select: {
            name: true,
            folder: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!question) {
      res.status(404).json({ message: 'Question not found or access denied' });
      return;
    }
    
    // Check if AI service is available
    const isAIServiceAvailable = await aiService.isAvailable();
    
    if (!isAIServiceAvailable) {
      // Fallback to simple evaluation for multiple-choice questions
      if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
        const isCorrect = userAnswer.trim().toLowerCase() === (question.answer || '').trim().toLowerCase();
        
        // Update mastery score and next review date if requested
        if (updateMastery) {
          const { newMastery, nextReviewDate } = calculateNextReview(question.masteryScore, isCorrect);
          
          await prisma.question.update({
            where: { id: questionId },
            data: {
              masteryScore: newMastery,
              nextReviewAt: nextReviewDate
            }
          });
        }
        
        res.status(200).json({
          evaluation: {
            isCorrect,
            score: isCorrect ? 1.0 : 0.0,
            feedback: isCorrect 
              ? 'Correct! Well done.' 
              : `Incorrect. The correct answer is: ${question.answer}`,
            correctedAnswer: question.answer
          }
        });
        return;
      }
      
      // For other question types, we need AI evaluation
      res.status(503).json({ 
        message: 'AI evaluation service is currently unavailable for this question type',
        fallback: false
      });
      return;
    }
    
    // Prepare request for AI service
    const evaluateRequest: EvaluateAnswerRequest = {
      questionId: question.id,
      questionText: question.text,
      expectedAnswer: question.answer || undefined,
      questionType: question.questionType,
      userAnswer,
      options: question.options,
      context: {
        questionSetName: question.questionSet.name,
        folderName: question.questionSet.folder?.name
      }
    };
    
    // Call AI service to evaluate the answer
    const evaluationResult = await aiService.evaluateAnswer(evaluateRequest);
    
    // Update mastery score and next review date if requested
    if (updateMastery) {
      // Convert the AI evaluation to a boolean for the spaced repetition algorithm
      // For partially correct answers, we use a threshold of 0.6
      const isCorrectForMastery = 
        evaluationResult.evaluation.isCorrect === true || 
        (evaluationResult.evaluation.isCorrect === 'partially_correct' && 
         evaluationResult.evaluation.score >= 0.6);
      
      const { newMastery, nextReviewDate } = calculateNextReview(question.masteryScore, isCorrectForMastery);
      
      await prisma.question.update({
        where: { id: questionId },
        data: {
          masteryScore: newMastery,
          nextReviewAt: nextReviewDate
        }
      });
    }
    
    // Return the evaluation result
    res.status(200).json({
      evaluation: evaluationResult.evaluation,
      metadata: evaluationResult.metadata,
      mastery: updateMastery ? {
        previousScore: question.masteryScore,
        // Include the updated mastery score and next review date
        newScore: (await prisma.question.findUnique({
          where: { id: questionId },
          select: { masteryScore: true, nextReviewAt: true }
        }))
      } : undefined
    });
    
  } catch (error) {
    console.error('Error evaluating answer:', error);
    next(error);
  }
};

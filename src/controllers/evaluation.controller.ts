/**
 * Evaluation Controller
 * 
 * This controller handles AI-powered evaluation of user answers to questions.
 * It integrates with the AI service for intelligent marking and feedback,
 * and updates the spaced repetition data based on the evaluation results.
 * 
 * Updated to work with Question Set-Level Spaced Repetition system.
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/aiService';
import { EvaluateAnswerRequest } from '../types/ai-service.types';
import { calculateQuestionSetNextReview } from '../services/spacedRepetition.service';

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
          include: {
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
        
        // Update question stats
        await prisma.question.update({
          where: { id: questionId },
          data: {
            lastAnswerCorrect: isCorrect,
            timesAnswered: { increment: 1 },
            timesAnsweredWrong: isCorrect ? undefined : { increment: 1 },
            // Update difficulty score based on answer correctness
            difficultyScore: {
              set: isCorrect 
                ? Math.max(0.1, (question.difficultyScore || 0.5) - 0.05) // Decrease difficulty slightly if correct
                : Math.min(1.0, (question.difficultyScore || 0.5) + 0.1)  // Increase difficulty more if wrong
            }
          }
        });
        
        // Update question set mastery if requested
        if (updateMastery) {
          // Determine which score to update based on UUE focus
          let scoreUpdate = {};
          // Use type assertion to access the uueFocus field
          const uueFocus = (question as any).uueFocus || 'Understand';
          
          if (uueFocus === 'Understand') {
            scoreUpdate = {
              understandScore: isCorrect 
                ? Math.min(100, (question.questionSet.understandScore || 0) + 5)
                : Math.max(0, (question.questionSet.understandScore || 0) - 3)
            };
          } else if (uueFocus === 'Use') {
            scoreUpdate = {
              useScore: isCorrect 
                ? Math.min(100, (question.questionSet.useScore || 0) + 5)
                : Math.max(0, (question.questionSet.useScore || 0) - 3)
            };
          } else if (uueFocus === 'Explore') {
            scoreUpdate = {
              exploreScore: isCorrect 
                ? Math.min(100, (question.questionSet.exploreScore || 0) + 5)
                : Math.max(0, (question.questionSet.exploreScore || 0) - 3)
            };
          }
          
          // Calculate new overall mastery score
          const reviewData = {
            userId,
            questionSetId: question.questionSet.id,
            understandScore: question.questionSet.understandScore || 0,
            useScore: question.questionSet.useScore || 0,
            exploreScore: question.questionSet.exploreScore || 0,
            // Calculate overall score as average of the three scores
            overallScore: Math.round((
              (question.questionSet.understandScore || 0) + 
              (question.questionSet.useScore || 0) + 
              (question.questionSet.exploreScore || 0)
            ) / 3),
            timeSpent: 0, // Not tracking time in this context
            // Add a single question answer for this evaluation
            questionAnswers: [{
              questionId: question.id,
              isCorrect: isCorrect,
              timeSpent: 0,
              confidence: 3 // Default middle confidence
            }],
            ...scoreUpdate
          };
          
          // Update the question set with new mastery scores
          await calculateQuestionSetNextReview(question.questionSet.id, reviewData);
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
      questionContext: {
        questionId: question.id,
        questionText: question.text,
        expectedAnswer: question.answer || undefined,
        questionType: question.questionType,
        options: question.options
      },
      userAnswer,
      context: {
        questionSetName: question.questionSet.name,
        folderName: question.questionSet.folder?.name
      }
    };
    
    // Call AI service to evaluate the answer
    const evaluationResult = await aiService.evaluateAnswer(evaluateRequest);
    
    // Convert the AI evaluation to a boolean for the spaced repetition algorithm
    // For partially correct answers, we use a threshold of 0.6
    const isCorrectForMastery = 
      evaluationResult.evaluation.isCorrect === true || 
      (evaluationResult.evaluation.isCorrect === 'partially_correct' && 
       evaluationResult.evaluation.score >= 0.6);
    
    // Update question stats
    await prisma.question.update({
      where: { id: questionId },
      data: {
        lastAnswerCorrect: isCorrectForMastery,
        timesAnswered: { increment: 1 },
        timesAnsweredWrong: isCorrectForMastery ? undefined : { increment: 1 },
        // Update difficulty score based on answer correctness
        difficultyScore: {
          set: isCorrectForMastery 
            ? Math.max(0.1, (question.difficultyScore || 0.5) - 0.05) // Decrease difficulty slightly if correct
            : Math.min(1.0, (question.difficultyScore || 0.5) + 0.1)  // Increase difficulty more if wrong
        }
      }
    });
    
    // Update question set mastery if requested
    if (updateMastery) {
      // Determine which score to update based on learning stage
      let scoreUpdate = {};
      // Use type assertion to access the uueFocus field
      const uueFocus = (question as any).uueFocus || 'Understand';
      
      if (uueFocus === 'Understand') {
        scoreUpdate = {
          understandScore: isCorrectForMastery 
            ? Math.min(100, (question.questionSet.understandScore || 0) + 5)
            : Math.max(0, (question.questionSet.understandScore || 0) - 3)
        };
      } else if (uueFocus === 'Use') {
        scoreUpdate = {
          useScore: isCorrectForMastery 
            ? Math.min(100, (question.questionSet.useScore || 0) + 5)
            : Math.max(0, (question.questionSet.useScore || 0) - 3)
        };
      } else if (uueFocus === 'Explore') {
        scoreUpdate = {
          exploreScore: isCorrectForMastery 
            ? Math.min(100, (question.questionSet.exploreScore || 0) + 5)
            : Math.max(0, (question.questionSet.exploreScore || 0) - 3)
        };
      }
      
      // Calculate new overall mastery score
      const reviewData = {
        userId,
        questionSetId: question.questionSet.id,
        understandScore: question.questionSet.understandScore || 0,
        useScore: question.questionSet.useScore || 0,
        exploreScore: question.questionSet.exploreScore || 0,
        // Calculate overall score as average of the three scores
        overallScore: Math.round((
          (question.questionSet.understandScore || 0) + 
          (question.questionSet.useScore || 0) + 
          (question.questionSet.exploreScore || 0)
        ) / 3),
        timeSpent: 0, // Not tracking time in this context
        // Add a single question answer for this evaluation
        questionAnswers: [{
          questionId: question.id,
          isCorrect: isCorrectForMastery,
          timeSpent: 0,
          confidence: 3 // Default middle confidence
        }],
        ...scoreUpdate
      };
      
      // Update the question set with new mastery scores
      await calculateQuestionSetNextReview(question.questionSet.id, reviewData);
    }
    
    // Get updated question set data
    const updatedQuestionSet = await prisma.questionSet.findUnique({
      where: { id: question.questionSet.id },
      select: { 
        understandScore: true,
        useScore: true,
        exploreScore: true,
        overallMasteryScore: true,
        nextReviewAt: true 
      }
    });
    
    // Return the evaluation result
    res.status(200).json({
      evaluation: evaluationResult.evaluation,
      metadata: evaluationResult.metadata,
      mastery: updateMastery ? {
        // Include the updated mastery scores
        questionSet: updatedQuestionSet,
        question: await prisma.question.findUnique({
          where: { id: questionId },
          select: { 
            difficultyScore: true,
            timesAnswered: true,
            timesAnsweredWrong: true,
            lastAnswerCorrect: true
          }
        })
      } : undefined
    });
    
  } catch (error) {
    console.error('Error evaluating answer:', error);
    next(error);
  }
};

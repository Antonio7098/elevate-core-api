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
import { calculateQuestionSetNextReview, updateQuestionPerformance } from '../services/spacedRepetition.service';

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

    // Define a variable to hold the data for UserQuestionAnswer
    let questionAnswerDataForDb: {
      questionId: number;
      isCorrect: boolean;
      userAnswerText: string;
      timeSpent: number;
      confidence?: number;
      scoreAchieved?: number;
    };
    
    let clientResponsePayload: any;

    if (!isAIServiceAvailable) {
      // Fallback to simple evaluation for multiple-choice or true-false questions
      if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
        const isCorrect = userAnswer.trim().toLowerCase() === (question.answer || '').trim().toLowerCase();
        const currentMarksAvailable = question.marksAvailable || 1; // Default to 1
        
        questionAnswerDataForDb = {
          questionId: question.id,
          isCorrect: isCorrect,
          userAnswerText: userAnswer, // Store original user answer from req.body for UserQuestionAnswer
          timeSpent: 0, // Placeholder, consider passing actual time from frontend
          confidence: 3, // Default confidence
          scoreAchieved: isCorrect ? currentMarksAvailable : 0 // Raw score
        };

        // Update question stats
        if (updateMastery) {
          await prisma.question.update({
          where: { id: questionId },
          data: {
            lastAnswerCorrect: isCorrect,
            timesAnsweredCorrectly: isCorrect ? { increment: 1 } : undefined,
            timesAnsweredIncorrectly: isCorrect ? undefined : { increment: 1 },
          }
        });

        // Log the answer attempt
        await updateQuestionPerformance([questionAnswerDataForDb], userId);
       }
        
        // if (updateMastery) { // Temporarily comment out this block
        //   let scoreUpdate = {};
        //   const uueFocus = (question as any).uueFocus || 'Understand';
        //   
        //   if (uueFocus === 'Understand') {
        //     scoreUpdate = {
        //       understandScore: isCorrect 
        //         ? Math.min(100, (question.questionSet.understandScore || 0) + 5)
        //         : Math.max(0, (question.questionSet.understandScore || 0) - 3)
        //     };
        //   } else if (uueFocus === 'Use') {
        //     scoreUpdate = {
        //       useScore: isCorrect 
        //         ? Math.min(100, (question.questionSet.useScore || 0) + 5)
        //         : Math.max(0, (question.questionSet.useScore || 0) - 3)
        //     };
        //   } else if (uueFocus === 'Explore') {
        //     scoreUpdate = {
        //       exploreScore: isCorrect 
        //         ? Math.min(100, (question.questionSet.exploreScore || 0) + 5)
        //         : Math.max(0, (question.questionSet.exploreScore || 0) - 3)
        //     };
        //   }
        //   
        //   const reviewData = {
        //     userId,
        //     questionSetId: question.questionSet.id,
        //     understandScore: question.questionSet.understandScore || 0,
        //     useScore: question.questionSet.useScore || 0,
        //     exploreScore: question.questionSet.exploreScore || 0,
        //     overallScore: Math.round(((
        //       (question.questionSet.understandScore || 0) + 
        //       (question.questionSet.useScore || 0) + 
        //       (question.questionSet.exploreScore || 0)
        //     )) / 3),
        //     timeSpent: 0, 
        //     questionAnswers: [questionAnswerDataForDb], // Use the structured data
        //     ...scoreUpdate
        //   };
        //   
        //   await calculateQuestionSetNextReview(question.questionSet.id, reviewData);
        // }
        
        clientResponsePayload = {
          evaluation: {
            isCorrect,
            score: (questionAnswerDataForDb.scoreAchieved ?? 0) / currentMarksAvailable, // Normalized score 0-1 for client
            feedback: isCorrect 
              ? 'Correct! Well done.' 
              : `Incorrect. The correct answer is: ${question.answer}`,
            correctedAnswer: question.answer,
            marksAvailable: currentMarksAvailable,
            scoreAchieved: questionAnswerDataForDb.scoreAchieved // Raw score for client
          }
        };
        res.status(200).json(clientResponsePayload);
        return;
      }
      
      // For other question types without AI, mark as pending evaluation or simple feedback
      questionAnswerDataForDb = {
        questionId: question.id,
        isCorrect: false, // Cannot determine
        userAnswerText: userAnswer, // Store original user answer from req.body for UserQuestionAnswer
        timeSpent: 0,
        scoreAchieved: 0 // No score awarded
      };
      await updateQuestionPerformance([questionAnswerDataForDb], userId);
      
      clientResponsePayload = {
        evaluation: {
          isCorrect: null, // Undetermined
          score: null,     // Undetermined
          feedback: 'This question type requires AI evaluation, which is currently unavailable. Your answer has been recorded.',
          pendingEvaluation: true,
          marksAvailable: question.marksAvailable || 1,
          scoreAchieved: 0
        },
        fallback: false
      };
      res.status(503).json(clientResponsePayload);
      return;
    }

    // AI Path
    try {
      const currentMarksAvailableForAI = question.marksAvailable || 1;
      const aiRequest: EvaluateAnswerRequest = {
        questionContext: {
          questionId: question.id,
          questionText: question.text,
          expectedAnswer: question.answer || undefined,
          questionType: question.questionType,
          options: (question as any).options || [], // Assuming options might be on the question object
          marksAvailable: currentMarksAvailableForAI
        },
        userAnswer: userAnswer, // AI Service expects 'userAnswer'
        context: {
          questionSetName: question.questionSet.name,
          folderName: question.questionSet.folder?.name
        }
      };

      const aiEvaluationResult = await aiService.evaluateAnswer(aiRequest);

      let rawScoreFromAI: number;
      let isCorrectFromAI: boolean;

      if (aiEvaluationResult.success && aiEvaluationResult.evaluation) {
        const evalData = aiEvaluationResult.evaluation;
        rawScoreFromAI = Math.round(evalData.score * currentMarksAvailableForAI);
        // Ensure rawScoreFromAI is within 0 and currentMarksAvailableForAI
        rawScoreFromAI = Math.max(0, Math.min(rawScoreFromAI, currentMarksAvailableForAI));

        if (evalData.isCorrect === true) {
          isCorrectFromAI = true;
        } else if (evalData.isCorrect === 'partially_correct') {
          isCorrectFromAI = true; // Treat partially correct as correct for this flag
        } else if (evalData.isCorrect === false) {
          isCorrectFromAI = false;
        } else {
          // Fallback if isCorrect is not a recognized boolean or 'partially_correct'
          isCorrectFromAI = rawScoreFromAI / currentMarksAvailableForAI >= 0.5; 
        }
        
        questionAnswerDataForDb = {
          questionId: question.id,
          isCorrect: isCorrectFromAI,
          userAnswerText: userAnswer, // Store original user answer from req.body for UserQuestionAnswer
          timeSpent: 0, // Placeholder
          scoreAchieved: rawScoreFromAI,
          confidence: aiEvaluationResult.metadata?.confidenceScore // Store confidence if available
        };

        clientResponsePayload = {
          evaluation: {
            isCorrect: (typeof evalData.isCorrect === 'string' && ['correct', 'partially_correct', 'incorrect'].includes(evalData.isCorrect)) 
                       ? evalData.isCorrect 
                       : isCorrectFromAI,
            score: evalData.score, // Normalized 0-1 score from AI
            feedback: evalData.feedback || (isCorrectFromAI ? 'Correct.' : 'Needs improvement.'),
            correctedAnswer: evalData.correctedAnswer,
            marksAvailable: currentMarksAvailableForAI,
            scoreAchieved: rawScoreFromAI // Raw score
          },
          metadata: aiEvaluationResult.metadata 
        };

      } else {
        // AI service call was not successful or evaluation block is missing
        console.error('AI evaluation failed or returned unexpected structure:', aiEvaluationResult);
        rawScoreFromAI = 0;
        isCorrectFromAI = false;
        questionAnswerDataForDb = {
          questionId: question.id,
          isCorrect: false,
          userAnswerText: userAnswer, // Store original answer
          timeSpent: 0,
          scoreAchieved: 0
        };
        clientResponsePayload = {
          evaluation: {
            isCorrect: null,
            score: null,
            feedback: 'AI evaluation was inconclusive. Answer recorded.',
            pendingEvaluation: true,
            marksAvailable: currentMarksAvailableForAI,
            scoreAchieved: 0
          }
        };
      }

      // Update question stats (remove difficultyScore)
      if (updateMastery) {
        await prisma.question.update({
        where: { id: questionId },
        data: {
          lastAnswerCorrect: isCorrectFromAI,
          timesAnsweredCorrectly: isCorrectFromAI ? { increment: 1 } : undefined,
          timesAnsweredIncorrectly: isCorrectFromAI ? undefined : { increment: 1 },
        }
      });
      }

      // Log the answer attempt
      if (updateMastery && questionAnswerDataForDb) {
         await updateQuestionPerformance([questionAnswerDataForDb], userId);
      }
      
      res.status(200).json(clientResponsePayload);

    } catch (aiError: any) {
      console.error('AI evaluation error:', aiError);
      // Fallback if AI evaluation fails catastrophically
      questionAnswerDataForDb = {
        questionId: question.id,
        isCorrect: false, // Cannot determine
        userAnswerText: userAnswer,
        timeSpent: 0,
        scoreAchieved: 0 // No score awarded
      };
      await updateQuestionPerformance([questionAnswerDataForDb], userId);

      res.status(500).json({
        message: 'AI evaluation service failed. Your answer has been recorded.',
        error: aiError.message || 'Unknown AI error',
        evaluation: {
          isCorrect: null,
          score: null,
          feedback: 'AI evaluation service failed. Your answer has been recorded but could not be evaluated.',
          pendingEvaluation: true,
          marksAvailable: question.marksAvailable || 1,
          scoreAchieved: 0
        }
      });
    }

  } catch (error) {
    console.error('Error evaluating answer:', error);
    // Ensure a UserQuestionAnswer record is created even in case of an unexpected error after initial checks
    // This helps in auditing and debugging, but only if userId and questionId are available.
    const { questionId } = req.body;
    const userId = req.user?.userId;
    if (userId && questionId) {
      try {
        const errorAnswerData = {
          questionId: parseInt(questionId as string, 10),
          isCorrect: false, // Mark as incorrect due to error
          userAnswerText: req.body.userAnswer || "Error during processing",
          timeSpent: 0,
          confidence: 0,
          scoreAchieved: 0,
          notes: `Error: ${error instanceof Error ? error.message : String(error)}` // Add error note
        };
        await updateQuestionPerformance([errorAnswerData], userId);
      } catch (dbError) {
        console.error('Failed to log error answer to DB:', dbError);
      }
    }
    next(error);
  }
};

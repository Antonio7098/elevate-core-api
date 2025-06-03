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
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/aiService';
import { EvaluateAnswerRequest } from '../types/ai-service.types';
import { processQuestionSetReview } from '../services/spacedRepetition.service';
import { FrontendReviewOutcome } from './review.controller';




/**
 * Evaluate a user's answer to a question using AI
 * POST /api/ai/evaluate-answer
 */
export const evaluateAnswer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { questionId, userAnswer, updateMastery = true, timeSpentOnQuestion = 0 } = req.body; // Added timeSpentOnQuestion
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    if (!questionId || typeof userAnswer === 'undefined') {
      res.status(400).json({ message: 'Missing required fields: questionId and userAnswer are required.' });
      return;
    }

    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        questionSet: { folder: { userId: userId } }
      },
      include: { questionSet: { include: { folder: true } } }
    });

    if (!question || !question.questionSet) { // Ensure questionSet is available
      res.status(404).json({ message: 'Question not found, not part of a set, or access denied' });
      return;
    }

    const isAIServiceAvailable = await aiService.isAvailable();
    console.log(`Controller: isAIServiceAvailable resolved to: ${isAIServiceAvailable} for questionId: ${questionId}`);
    let evaluationResult: any; // To store AI or manual evaluation outcome
    let clientResponsePayload: any;
    let scoreForSr: number; // Normalized score (0-5) for Spaced Repetition

    // Helper function to determine if AI evaluation is required
    const isAIEvaluationRequired = (qType: string): boolean => {
      return !['multiple-choice', 'true-false', 'short-answer-exact'].includes(qType);
    };

    if (!isAIServiceAvailable && isAIEvaluationRequired(question.questionType)) {
      // AI needed but unavailable: Record answer, mark as pending, inform user
      scoreForSr = 0; // No evaluation, so score is 0 for SR
      clientResponsePayload = {
        evaluation: {
          isCorrect: null,
          score: null,
          feedback: 'AI evaluation is currently unavailable. Your answer has been recorded and will be evaluated later.',
          pendingEvaluation: true,
          marksAvailable: question.totalMarksAvailable || 1,
          scoreAchieved: 0,
        },
        message: 'AI evaluation service unavailable. Answer recorded for later evaluation.',
        fallback: false // Added as per test expectation
      };
      // Update question stats: increment timesAnsweredIncorrectly as it's unevaluated
      if (updateMastery) {
        await prisma.question.update({
          where: { id: questionId },
          data: { timesAnsweredIncorrectly: { increment: 1 } },
        });
      }
      res.status(503).json(clientResponsePayload);

    } else if (!isAIEvaluationRequired(question.questionType) || (!isAIServiceAvailable && !isAIEvaluationRequired(question.questionType))) {
      // Manual evaluation path (MCQ, T/F, Short-Answer-Exact) OR AI not needed and not available
      const userAnswerTrimmed = userAnswer.trim().toLowerCase();
      const correctAnswerTrimmed = (question.answer || '').trim().toLowerCase();
      const isCorrect = userAnswerTrimmed === correctAnswerTrimmed;
      const marksAvailable = question.totalMarksAvailable || 1;
      const scoreAchieved = isCorrect ? marksAvailable : 0;
      scoreForSr = isCorrect ? 5 : 1; // Max score for correct, min for incorrect

      evaluationResult = {
        isCorrect: isCorrect,
        score: scoreAchieved / marksAvailable, // Normalized 0-1
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.answer}`,
        correctedAnswer: question.answer,
        marksAvailable: marksAvailable,
        scoreAchieved: scoreAchieved,
      };
      clientResponsePayload = { evaluation: evaluationResult };

      if (updateMastery) {
        await prisma.question.update({
          where: { id: questionId },
          data: {
            timesAnsweredCorrectly: isCorrect ? { increment: 1 } : undefined,
            timesAnsweredIncorrectly: !isCorrect ? { increment: 1 } : undefined,
          },
        });
      }
      res.status(200).json(clientResponsePayload);

    } else {
      // AI Evaluation Path
      try {
        const marksAvailable = question.totalMarksAvailable || 1;
        // Construct the payload for the AI service, conforming to EvaluateAnswerRequest.
        const aiServicePayload: EvaluateAnswerRequest = {
          questionContext: {
            questionId: question.id,
            questionText: question.text,
            expectedAnswer: question.answer || undefined,
            questionType: question.questionType,
            options: (question as any).options || [],
            marksAvailable: marksAvailable,
          },
          userAnswer: userAnswer,
          context: {
            questionSetName: question.questionSet.name,
            folderName: question.questionSet.folder?.name,
          }
        };

        console.log('aiServicePayload before call (EvaluateAnswerRequest structure):', JSON.stringify(aiServicePayload, null, 2));

        // Call the AI service. Cast to 'any' to bypass TypeScript type checking for this
        // temporary payload structure, as aiService.evaluateAnswer expects EvaluateAnswerRequest.
        const aiResult = await aiService.evaluateAnswer(aiServicePayload);

        if (aiResult.success && aiResult.evaluation) {
          const evalData = aiResult.evaluation;
          const scoreAchieved = Math.max(0, Math.min(Math.round(evalData.score * marksAvailable), marksAvailable));
          let isCorrectFlagForStats: boolean;

          if (typeof evalData.isCorrect === 'boolean') {
            isCorrectFlagForStats = evalData.isCorrect;
          } else if (evalData.isCorrect === 'partially_correct') {
            isCorrectFlagForStats = true; // Treat as correct for stats if partially correct
          } else {
            isCorrectFlagForStats = scoreAchieved / marksAvailable >= 0.5; // Fallback based on score
          }
          
          // Map AI score (0-1 normalized) to SR score (0-5)
          if (evalData.score === 0) scoreForSr = 0;
          else if (evalData.score < 0.2) scoreForSr = 1;
          else if (evalData.score < 0.4) scoreForSr = 2;
          else if (evalData.score < 0.6) scoreForSr = 3;
          else if (evalData.score < 0.8) scoreForSr = 4;
          else scoreForSr = 5;

          evaluationResult = {
            isCorrect: evalData.isCorrect,
            score: evalData.score,
            feedback: evalData.feedback || (evalData.isCorrect === true ? 'Correct!' : 'Further review may be needed.'),
            correctedAnswer: evalData.correctedAnswer || question.answer, // Default to original answer if AI doesn't provide one
            marksAvailable: marksAvailable,
            scoreAchieved: scoreAchieved,
          };
          clientResponsePayload = {
            evaluation: evaluationResult,
            metadata: aiResult.metadata ? {
              processingTime: aiResult.metadata.processingTime,
              model: aiResult.metadata.model,
              confidenceScore: aiResult.metadata.confidenceScore,
            } : undefined,
          };

          if (updateMastery) {
            await prisma.question.update({
              where: { id: questionId },
              data: {
                timesAnsweredCorrectly: isCorrectFlagForStats ? { increment: 1 } : undefined,
                timesAnsweredIncorrectly: !isCorrectFlagForStats ? { increment: 1 } : undefined,
              },
            });
          }
          res.status(200).json(clientResponsePayload);
        } else {
          // AI evaluation failed or inconclusive
          console.error('AI evaluation inconclusive:', aiResult);
          scoreForSr = 0; // Treat as incorrect for SR
          clientResponsePayload = {
            evaluation: {
              isCorrect: null,
              score: null,
              feedback: aiResult.evaluation?.feedback || 'AI evaluation was inconclusive. Your answer has been recorded.',
              pendingEvaluation: true,
              marksAvailable: question.totalMarksAvailable || 1,
              scoreAchieved: 0,
            },
             message: 'AI evaluation inconclusive. Answer recorded for potential manual review.'
          };
           if (updateMastery) {
            await prisma.question.update({ // Still update attempt count
              where: { id: questionId },
              data: { timesAnsweredIncorrectly: { increment: 1 } },
            });
          }
          res.status(200).json(clientResponsePayload); // 200 because answer recorded, but evaluation is pending/failed
        }
      } catch (aiError: any) {
        console.error('AI service error during evaluation:', aiError);
        scoreForSr = 0; // Treat as incorrect for SR
        clientResponsePayload = {
          message: 'AI evaluation service encountered an error. Your answer has been recorded.',
          error: aiError.message || 'Unknown AI error',
          evaluation: {
            isCorrect: null,
            score: null,
            feedback: 'AI evaluation service failed. Your answer has been recorded.',
            pendingEvaluation: true,
            marksAvailable: question.totalMarksAvailable || 1,
            scoreAchieved: 0,
          },
        };
        if (updateMastery) {
          await prisma.question.update({ // Still update attempt count
            where: { id: questionId },
            data: { timesAnsweredIncorrectly: { increment: 1 } },
          });
        }
        res.status(500).json(clientResponsePayload);
      }
    }

    // Spaced Repetition Update (common path, if updateMastery is true and questionSet exists)
    if (updateMastery && question.questionSet) {
      const outcomeForSpacedRepetition = {
        questionId: question.id, // Use number directly, as expected by processQuestionSetReview
        scoreAchieved: scoreForSr, // Use the 0-5 score
        userAnswerText: userAnswer,
        timeSpentOnQuestion: timeSpentOnQuestion, // Use from request body
        // uueFocus is not part of the 'outcomes' element structure for processQuestionSetReview.
        // The service function will derive uueFocus from the question object it fetches.
      };

      try {
        await processQuestionSetReview(
          userId,
          [outcomeForSpacedRepetition],
          new Date(), // sessionStartTime (can be approximated or passed from client)
          0 // sessionDurationSeconds (can be approximated or passed from client if this is a single Q eval)
        );
      } catch (srError) {
        console.error(`Spaced repetition update failed for question ${questionId} in set ${question.questionSet.id}:`, srError);
        // Log error, but don't let SR failure break the primary evaluation flow response to client
      }
    } else if (updateMastery && !question.questionSet) {
        console.warn(`SR update skipped for question ${questionId}: Question set missing.`);
    }

  } catch (error: any) {
    console.error('Overall error in evaluateAnswer:', error);
    // Generic error handling
    const { questionId: qIdFromReqString, userAnswer: uaFromReq, updateMastery: umFromReq = true } = req.body;
    const uIdFromReq = req.user?.userId;

    if (uIdFromReq && qIdFromReqString && umFromReq) {
        try {
            const numericQId = parseInt(qIdFromReqString, 10);
            if (isNaN(numericQId)) {
                console.error(`Invalid questionId format in request body: ${qIdFromReqString}`);
                // Optionally, you might want to send a 400 response here
                // For now, we'll let it proceed, and it might fail further down if qExists is null
            }

            const qExists = await prisma.question.findUnique({ 
                where: { id: numericQId }, // Use parsed numeric ID
                include: { questionSet: true } 
            });

            if (qExists && qExists.questionSet) {
                 const fallbackOutcomeTyped: FrontendReviewOutcome = {
                    questionId: numericQId.toString(), // Store as string for FrontendReviewOutcome type
                    scoreAchieved: 0,
                    userAnswerText: uaFromReq || "Error during processing",
                    timeSpentOnQuestion: req.body.timeSpentOnQuestion || 0,
                    uueFocus: (qExists.uueFocus === "Understand" || qExists.uueFocus === "Use" || qExists.uueFocus === "Explore") ? qExists.uueFocus : undefined,
                };

                // Construct the payload for processQuestionSetReview with numeric questionId and correct fields
                const reviewOutcomeForService = {
                    questionId: numericQId, // Use numeric ID for the service
                    scoreAchieved: fallbackOutcomeTyped.scoreAchieved,
                    userAnswerText: fallbackOutcomeTyped.userAnswerText,
                    timeSpentOnQuestion: fallbackOutcomeTyped.timeSpentOnQuestion,
                    // uueFocus is not part of the type expected by processQuestionSetReview's outcomes
                };

                await processQuestionSetReview(
                    uIdFromReq,
                    [reviewOutcomeForService],
                    new Date(),
                    0
                );
                console.log(`Fallback SR update for question ${numericQId} due to error: ${error.message}`);
            }
        } catch (dbError) {
            console.error('Failed to log error answer to SR/DB in global catch:', dbError);
        }
    }
    next(error); // Pass to global error handler
  }
};

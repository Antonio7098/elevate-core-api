import { Question, QuestionSet } from '@prisma/client';

/**
 * Represents a Question augmented with context about its parent QuestionSet
 * and the UUE focus for which it was selected in the current session.
 */
export interface QuestionWithContext extends Omit<Question, 'selfMark' | 'autoMark' | 'aiGenerated' | 'inCat'> {
  questionSetId: number;
  questionSetName: string;
  selectedForUUEFocus?: string; // The UUE focus this question is intended for in the session
  selfMark?: boolean | null;
  autoMark?: boolean | null;
  aiGenerated?: boolean | null;
  inCat?: string | null;
}

/**
 * Defines the structure of the response for the Today's Tasks API endpoint.
 */
export interface TodaysTasksResponse {
  criticalQuestions: QuestionWithContext[];
  coreQuestions: QuestionWithContext[];
  plusQuestions: QuestionWithContext[];
  targetQuestionCount: number;
  selectedCoreAndCriticalCount: number; // Combined count of questions in critical and core lists
}

/**
 * A leaner type for QuestionSet when fetching due sets, containing only essential fields.
 */
export type DueQuestionSet = Pick<
  QuestionSet,
  'id' | 'name' | 'currentUUESetStage' | 'currentTotalMasteryScore' | 'nextReviewAt'
>;

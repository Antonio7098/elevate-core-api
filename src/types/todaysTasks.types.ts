/**
 * Represents a Question augmented with context about its parent QuestionSet
 * and the UUE focus for which it was selected in the current session.
 */
export interface QuestionWithContext {
  id: number;
  answer: string | null;
  questionSetId: number;
  createdAt: Date;
  updatedAt: Date;
  options: string[];
  questionType: string;
  text: string;
  conceptTags: string[];
  lastAnswerCorrect: boolean | null;
  uueFocus: string;
  totalMarksAvailable: number;
  markingCriteria: any | null;
  currentMasteryScore: number | null;
  difficultyScore: number | null;
  timesAnsweredCorrectly: number;
  timesAnsweredIncorrectly: number;
  selfMark: boolean | null;
  autoMark: boolean | null;
  aiGenerated: boolean | null;
  inCat: string | null;
  imageUrls: string[];
  questionSetName: string;
  selectedForUUEFocus?: string;
}

/**
 * Represents a Question with selected answers and additional fields
 */
export interface QuestionWithSelectedAnswers {
  id: number;
  answer: string | null;
  questionSetId: number;
  createdAt: Date;
  updatedAt: Date;
  options: string[];
  questionType: string;
  text: string;
  conceptTags: string[];
  lastAnswerCorrect: boolean | null;
  uueFocus: string;
  totalMarksAvailable: number;
  markingCriteria: any | null;
  currentMasteryScore: number | null;
  difficultyScore: number | null;
  timesAnsweredCorrectly: number;
  timesAnsweredIncorrectly: number;
  selfMark: boolean;
  autoMark: boolean;
  aiGenerated: boolean;
  inCat: string | null;
  imageUrls: string[];
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
export interface DueQuestionSet {
  id: number;
  name: string;
  currentUUESetStage: string;
  currentTotalMasteryScore: number;
  nextReviewAt: Date | null;
}

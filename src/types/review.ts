/**
 * Represents the outcome of a single question review from the frontend.
 */
export interface FrontendReviewOutcome {
  questionId: number;
  marksAchieved: number;
  marksAvailable: number;
  userAnswerText?: string;
  timeSpentOnQuestion?: number; // in seconds
}

/**
 * Represents the entire payload for a review submission from the frontend.
 */
export interface FrontendReviewSubmission {
  questionSetId?: string; // Optional: kept for frontend context, but not used for authorization
  outcomes: FrontendReviewOutcome[];
  sessionDurationSeconds: number;
}

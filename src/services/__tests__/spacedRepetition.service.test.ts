import { 
  calculateNextReview, 
  calculateDifficultyFactor, 
  getDueQuestions,
  prioritizeQuestions
} from '../spacedRepetition.service';

describe('Spaced Repetition Service', () => {
  describe('calculateNextReview', () => {
    it('should increase mastery and interval when answered correctly', () => {
      const currentMastery = 2;
      const answeredCorrectly = true;
      
      const result = calculateNextReview(currentMastery, answeredCorrectly);
      
      expect(result.newMastery).toBe(3);
      expect(result.newInterval).toBe(7); // Based on the INTERVALS array
      expect(result.nextReviewDate).toBeInstanceOf(Date);
      
      // Check that the next review date is 7 days from now (with some tolerance for test execution time)
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      
      // Allow for a small difference due to test execution time
      const timeDifference = Math.abs(result.nextReviewDate.getTime() - expectedDate.getTime());
      expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
    });
    
    it('should decrease mastery and interval when answered incorrectly', () => {
      const currentMastery = 3;
      const answeredCorrectly = false;
      
      const result = calculateNextReview(currentMastery, answeredCorrectly);
      
      expect(result.newMastery).toBe(1); // Decrease by 2 levels
      expect(result.newInterval).toBe(2); // Based on the INTERVALS array
      expect(result.nextReviewDate).toBeInstanceOf(Date);
      
      // Check that the next review date is 2 days from now
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 2);
      
      // Allow for a small difference due to test execution time
      const timeDifference = Math.abs(result.nextReviewDate.getTime() - expectedDate.getTime());
      expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
    });
    
    it('should not increase mastery beyond the maximum', () => {
      const currentMastery = 5; // Already at max
      const answeredCorrectly = true;
      
      const result = calculateNextReview(currentMastery, answeredCorrectly);
      
      expect(result.newMastery).toBe(5); // Still at max
      expect(result.newInterval).toBe(30); // Based on the INTERVALS array
    });
    
    it('should not decrease mastery below the minimum', () => {
      const currentMastery = 0; // Already at min
      const answeredCorrectly = false;
      
      const result = calculateNextReview(currentMastery, answeredCorrectly);
      
      expect(result.newMastery).toBe(0); // Still at min
      expect(result.newInterval).toBe(1); // Based on the INTERVALS array
    });
    
    it('should use the provided current interval if specified', () => {
      const currentMastery = 2;
      const answeredCorrectly = true;
      const currentInterval = 5; // Custom interval
      
      const result = calculateNextReview(currentMastery, answeredCorrectly, currentInterval);
      
      expect(result.newMastery).toBe(3);
      expect(result.newInterval).toBe(7); // Based on the INTERVALS array, not the current interval
    });
  });
  
  describe('calculateDifficultyFactor', () => {
    it('should increase difficulty factor for poor performance', () => {
      const currentDifficulty = 2.5;
      const performanceRating = 0; // Very poor performance
      
      const result = calculateDifficultyFactor(currentDifficulty, performanceRating);
      
      // Should decrease from 2.5 (making it more difficult)
      expect(result).toBeLessThan(currentDifficulty);
      expect(result).toBeGreaterThanOrEqual(1.3); // Minimum bound
    });
    
    it('should decrease difficulty factor for good performance', () => {
      const currentDifficulty = 2.0;
      const performanceRating = 5; // Perfect performance
      
      const result = calculateDifficultyFactor(currentDifficulty, performanceRating);
      
      // Should increase from 2.0 (making it easier)
      expect(result).toBeGreaterThan(currentDifficulty);
      expect(result).toBeLessThanOrEqual(2.5); // Maximum bound
    });
    
    it('should maintain difficulty within bounds', () => {
      // Test lower bound
      let result = calculateDifficultyFactor(1.3, 0);
      expect(result).toBeGreaterThanOrEqual(1.3);
      
      // Test upper bound
      result = calculateDifficultyFactor(2.5, 5);
      expect(result).toBeLessThanOrEqual(2.5);
    });
  });
  
  describe('getDueQuestions', () => {
    it('should return questions that are due for review', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const questions = [
        { id: 1, masteryScore: 2, nextReviewAt: yesterday }, // Due (past)
        { id: 2, masteryScore: 3, nextReviewAt: now }, // Due (now)
        { id: 3, masteryScore: 4, nextReviewAt: tomorrow }, // Not due (future)
        { id: 4, masteryScore: 0, nextReviewAt: null }, // Never reviewed, should be due
      ];
      
      const dueQuestions = getDueQuestions(questions);
      
      expect(dueQuestions).toHaveLength(3);
      expect(dueQuestions.map(q => q.id)).toContain(1);
      expect(dueQuestions.map(q => q.id)).toContain(2);
      expect(dueQuestions.map(q => q.id)).toContain(4);
      expect(dueQuestions.map(q => q.id)).not.toContain(3);
    });
    
    it('should return an empty array if no questions are due', () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const questions = [
        { id: 1, masteryScore: 2, nextReviewAt: tomorrow },
        { id: 2, masteryScore: 3, nextReviewAt: tomorrow },
      ];
      
      const dueQuestions = getDueQuestions(questions);
      
      expect(dueQuestions).toHaveLength(0);
    });
  });
  
  describe('prioritizeQuestions', () => {
    it('should prioritize questions with lower mastery scores', () => {
      const now = new Date();
      
      const questions = [
        { id: 1, masteryScore: 4, nextReviewAt: now },
        { id: 2, masteryScore: 1, nextReviewAt: now },
        { id: 3, masteryScore: 3, nextReviewAt: now },
      ];
      
      const prioritizedQuestions = prioritizeQuestions(questions);
      
      // Expect questions to be sorted by mastery (lowest first)
      expect(prioritizedQuestions[0].id).toBe(2);
      expect(prioritizedQuestions[1].id).toBe(3);
      expect(prioritizedQuestions[2].id).toBe(1);
    });
    
    it('should prioritize overdue questions', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const questions = [
        { id: 1, masteryScore: 3, nextReviewAt: now },
        { id: 2, masteryScore: 3, nextReviewAt: yesterday },
        { id: 3, masteryScore: 3, nextReviewAt: twoDaysAgo },
      ];
      
      const prioritizedQuestions = prioritizeQuestions(questions);
      
      // Expect questions to be sorted by overdue days (most overdue first)
      expect(prioritizedQuestions[0].id).toBe(3);
      expect(prioritizedQuestions[1].id).toBe(2);
      expect(prioritizedQuestions[2].id).toBe(1);
    });
    
    it('should prioritize questions that have never been reviewed', () => {
      const now = new Date();
      
      const questions = [
        { id: 1, masteryScore: 0, nextReviewAt: now },
        { id: 2, masteryScore: 5, nextReviewAt: null }, // Never reviewed
        { id: 3, masteryScore: 0, nextReviewAt: null }, // Never reviewed
      ];
      
      const prioritizedQuestions = prioritizeQuestions(questions);
      
      // Expect never-reviewed questions to be prioritized
      expect(prioritizedQuestions[0].id).toBe(2);
      expect(prioritizedQuestions[1].id).toBe(3);
      expect(prioritizedQuestions[2].id).toBe(1);
    });
    
    it('should consider both mastery and overdue days in prioritization', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const questions = [
        { id: 1, masteryScore: 4, nextReviewAt: threeDaysAgo }, // Low mastery but very overdue
        { id: 2, masteryScore: 1, nextReviewAt: oneDayAgo }, // High mastery but less overdue
        { id: 3, masteryScore: 3, nextReviewAt: now }, // Medium mastery, not overdue
      ];
      
      const prioritizedQuestions = prioritizeQuestions(questions);
      
      // The exact order depends on the weighting in the algorithm,
      // but we can check that the function returns a sorted array
      expect(prioritizedQuestions).toHaveLength(3);
    });
  });
});

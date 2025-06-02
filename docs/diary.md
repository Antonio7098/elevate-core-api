# Elevate Core API Development Diary

## 2025-06-01: Stats Page API Implementation Complete

Based on my review, I can confirm that we've successfully implemented all the required backend API enhancements for the Stats Page. Here's a summary of what's been completed:

### 1. MasteryHistory Population (Prerequisite)
- ✅ The `processQuestionSetReview` function in `spacedRepetition.service.ts` properly appends entries to the QuestionSet's `masteryHistory` when a review is processed.
- ✅ The entries include timestamp, totalMasteryScore, understandScore, useScore, and exploreScore as required.
- ✅ For Folder mastery, we've implemented the logic to:
  - Find the parent folder of the reviewed QuestionSet
  - Recalculate the Folder's `currentMasteryScore` by averaging its QuestionSets' scores
  - Append an entry to the Folder's `masteryHistory` with timestamp and aggregatedScore

### 2. API Endpoint for QuestionSet Mastery History & SR Details
- ✅ Implemented `GET /api/stats/questionsets/:setId/details` endpoint
- ✅ The endpoint is properly protected with authentication
- ✅ It verifies user ownership of the QuestionSet
- ✅ Returns all required data:
  - masteryHistory array with historical scores
  - reviewCount
  - reviewDates (extracted from UserQuestionSetReview records)
  - currentSRStatus with lastReviewedAt, nextReviewAt, currentIntervalDays, and currentForgottenPercentage

### 3. API Endpoint for Folder Mastery History & Stats
- ✅ Implemented `GET /api/stats/folders/:folderId/details` endpoint
- ✅ The endpoint is properly protected with authentication
- ✅ It verifies user ownership of the Folder
- ✅ Returns all required data:
  - masteryHistory array with historical aggregated scores
  - totalReviewSessionsInFolder count
  - questionSetSummaries with id, name, currentTotalMasteryScore, and nextReviewAt for each set in the folder

### 4. Testing
- ✅ Comprehensive integration tests for both endpoints
- ✅ Tests cover authentication, authorization, and data retrieval
- ✅ All tests are passing

The backend implementation is complete and ready to support the frontend Stats Page development. The API endpoints provide all the necessary data for displaying "Mastery Over Time" graphs, "Times Practiced" information, and "Forgetting Curve" data as specified in the requirements.

---

## 2025-05-30: Spaced Repetition Refinement Analysis

### What's Already Implemented:
- **Basic QuestionSet U-U-E Component Score Calculation**:
  - The function already calculates separate scores for Understand, Use, and Explore questions
  - It finds the most recent answer for each question and uses that score
  - It properly handles questions with no answers (defaulting to 0)
  - It scales the raw scores to 0-100 for storage
- **QuestionSet.currentTotalMasteryScore Calculation**:
  - The weighted average (40/40/20) of the U-U-E component scores is calculated correctly
- **Individual Question Updates**:
  - Updates to question stats (currentMasteryScore, lastAnswerCorrect, timesAnswered, etc.)
- **QuestionSet SR Data Updates**:
  - Updates to nextReviewAt, currentIntervalDays, lastReviewedAt, reviewCount based on the mastery score

### What's Missing:
- **Parent Folder Mastery Update Logic**:
  - The code doesn't retrieve the folderId for the current QuestionSet
  - It doesn't fetch all QuestionSets belonging to this folderId and userId
  - It doesn't calculate the average of their currentTotalMasteryScore values
  - It doesn't update the currentMasteryScore field on the parent Folder model
  - It doesn't update the Folder.masteryHistory field
- **Optimization in U-U-E Score Calculation**:
  - The current implementation fetches the most recent answer for each question individually, which could be optimized by fetching all relevant UserQuestionAnswers upfront

---

## 2025-05-28: Mastery Calculation Logic Refinements Complete

All the tests are now passing. I've successfully implemented the refinements to the mastery calculation logic in the `processQuestionSetReview` function as requested. Here's a summary of the changes I made:

1. **Refined QuestionSet U-U-E Component Score Calculation**:
   - Optimized the calculation by fetching all relevant UserQuestionAnswers upfront instead of making individual database queries for each question
   - Created an efficient lookup map for the most recent answer for each question
   - Maintained the proper calculation of component scores based on the UUE focus of each question

2. **Improved Error Handling**:
   - Added proper error throwing for non-existent questions instead of just logging a warning and skipping
   - This ensures the controller returns a 404 status when a question is not found, as expected by the tests

3. **Implemented Parent Folder Mastery Update Logic**:
   - Added code to retrieve the folder ID for each question set
   - Fetched all question sets belonging to the same folder and user
   - Calculated the average of their currentTotalMasteryScore values
   - Updated the parent folder's currentMasteryScore field
   - Added entries to the folder's masteryHistory field to track changes over time

4. **Fixed Return Value**:
   - Modified the function to return the updated question set object instead of just IDs
   - This ensures the controller can return the complete question set data to the client
   - Added proper error handling for cases where no question sets are updated or the updated set can't be retrieved

These changes ensure that:
- The U-U-E component scores are calculated precisely according to your requirements
- The parent folder's mastery score is properly updated based on its question sets
- All tests pass, including the previously failing ones for incorrect answers and non-existent questions

The implementation now fully aligns with your vision for Question Set and Folder level mastery tracking, providing accurate and meaningful data for the spaced repetition system.

---

## 2025-05-25: Question Set Review Process Documentation

### Question Set Review Process in Elevate Core API

Here's an outline of how the question set review process works in our system:

#### 1. Review Submission Flow
- **User Submits Review**: The frontend sends a POST request to `/api/reviews` with:
  - `questionSetId`: ID of the set being reviewed
  - `outcomes`: Array of question results (questionId, scoreAchieved, userAnswerText, timeSpent)
  - `sessionDurationSeconds`: Total time spent on the review
- **Controller Processing**: `review.controller.ts` validates the request and calls the service layer
- **Service Processing**: `spacedRepetition.service.ts#processQuestionSetReview` handles the core logic

#### 2. Database Transaction in `processQuestionSetReview`
The function executes all updates in a single database transaction to ensure data consistency:

```typescript
return prisma.$transaction(async (tx) => {
   // All database operations happen here
});
```

#### 3. Key Steps in Processing

##### A. Create Study Session Record
- Creates a `UserStudySession` record to track the overall review session
- Records user ID, question set ID, start time, and duration

##### B. Create Answer Records
- Creates `UserQuestionAnswer` records for each question answered
- Stores score achieved, answer text, and time spent on each question

##### C. Update Individual Question Stats
- For each question answered, updates statistics like:
  - Times answered correctly/incorrectly
  - Last answered date

##### D. Calculate U-U-E Component Scores
1. **Group Questions by U-U-E Focus**:
   - Understand questions (including those with no focus specified)
   - Use questions
   - Explore questions

2. **For Each Component**:
   - Find the most recent answer for each question in that category
   - Use score of 0 for questions never answered
   - Calculate average score (sum of scores / number of questions)
   - Scale to 0-100 range and round to integer

3. **Calculate Total Mastery Score**:
   - Apply weighted average: 40% Understand + 40% Use + 20% Explore
   - Round to integer

##### E. Update Spaced Repetition Fields
1. **Calculate Next Review Interval**:
   - Determine interval days based on mastery score using `getIntervalForMastery`
   - Higher mastery = longer interval between reviews

2. **Calculate Forgetting Percentage**:
   - If previously reviewed, calculate retention based on:
     - Days since last review
     - Review count (more reviews = better retention)
   - Convert retention to forgetting percentage (0-100%)

##### F. Update Question Set
- Update U-U-E component scores
- Update total mastery score
- Update last reviewed date
- Increment review count
- Set next review date
- Update forgetting percentage
- Append to mastery history array (for tracking progress over time)

##### G. Update Parent Folder
- Find the parent folder
- Recalculate folder's mastery score by averaging all contained question sets
- Append to folder's mastery history array

##### H. Return Updated Data
- Return the updated question set object and session ID to the controller

#### 4. Response to User
The controller returns the updated question set data to the frontend, which can then show the user their updated mastery scores and when they should next review the material.

This spaced repetition system ensures that material is reviewed at optimal intervals based on the user's demonstrated mastery, following principles of cognitive science to maximize long-term retention.
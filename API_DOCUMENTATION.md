# Elevate Core API Documentation

## Spaced Repetition System API

The Elevate Core API implements a Question Set-Level Spaced Repetition system based on the U-U-E (Understand, Use, Explore) framework. This document outlines the API endpoints and data models related to this system.

### Data Models

#### Question

The Question model represents an individual question within a question set.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier for the question |
| text | string | The question text |
| answer | string | The correct answer |
| options | string[] | Array of options for multiple-choice questions |
| questionType | string | Type of question (e.g., 'multiple-choice', 'short-answer') |
| uueFocus | string | The U-U-E focus stage ('Understand', 'Use', or 'Explore') |
| difficultyScore | number | Difficulty score between 0.1 and 1.0 |
| timesAnswered | number | Number of times the question has been answered |
| timesAnsweredWrong | number | Number of times the question has been answered incorrectly |
| lastAnswerCorrect | boolean | Whether the last answer was correct |
| conceptTags | string[] | Tags representing concepts covered by the question |
| questionSetId | number | ID of the parent question set |

#### QuestionSet

The QuestionSet model represents a collection of related questions.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier for the question set |
| name | string | Name of the question set |
| folderId | number | ID of the parent folder |
| masteryOverTime | JSON | Historical data tracking mastery progress |
| overallMasteryScore | number | Overall mastery score (0-100) |
| understandScore | number | Mastery score for 'Understand' stage (0-100) |
| useScore | number | Mastery score for 'Use' stage (0-100) |
| exploreScore | number | Mastery score for 'Explore' stage (0-100) |
| forgettingScore | number | Score representing forgetting curve effect (0-100) |
| nextReviewAt | Date | Date when the question set is due for review |
| currentIntervalDays | number | Current interval between reviews in days |
| lastReviewedAt | Date | Date when the question set was last reviewed |
| reviewCount | number | Number of times the question set has been reviewed |

#### UserQuestionAnswer

The UserQuestionAnswer model tracks user answers to questions.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier for the answer record |
| userId | number | ID of the user who answered |
| questionId | number | ID of the question answered |
| userAnswer | string | The user's answer |
| isCorrect | boolean | Whether the answer was correct |
| scoreAchieved | number | Score achieved for this answer (0-100) |
| confidence | number | User's confidence level (optional) |
| timeSpent | number | Time spent answering in milliseconds |
| answeredAt | Date | When the question was answered |

### API Endpoints

#### Get Due Reviews

Retrieves question sets that are due for review today.

```
GET /api/reviews/today
```

**Response:**

```json
{
  "dueReviews": [
    {
      "id": 1,
      "name": "Biology Chapter 1",
      "folderName": "Biology",
      "overallMasteryScore": 75,
      "understandScore": 85,
      "useScore": 70,
      "exploreScore": 60,
      "nextReviewAt": "2025-05-27T10:00:00.000Z",
      "lastReviewedAt": "2025-05-20T10:00:00.000Z",
      "reviewCount": 3,
      "previewQuestions": [
        {
          "id": 1,
          "text": "What is photosynthesis?",
          "questionType": "short-answer",
          "uueFocus": "Understand"
        }
      ]
    }
  ]
}
```

#### Get Review Questions

Retrieves questions for a specific review session.

```
GET /api/reviews/questions/:questionSetId
```

**Response:**

```json
{
  "questions": [
    {
      "id": 1,
      "text": "What is photosynthesis?",
      "questionType": "short-answer",
      "options": [],
      "uueFocus": "Understand",
      "difficultyScore": 0.5,
      "priorityScore": 85
    }
  ],
  "questionSet": {
    "id": 1,
    "name": "Biology Chapter 1",
    "understandScore": 85,
    "useScore": 70,
    "exploreScore": 60,
    "overallMasteryScore": 75
  }
}
```

#### Submit Review

Submits a review for a question set.

```
POST /api/reviews
```

**Request Body:**

```json
{
  "questionSetId": 1,
  "understandScore": 85,
  "useScore": 70,
  "exploreScore": 60,
  "overallScore": 75,
  "timeSpent": 300000,
  "questionAnswers": [
    {
      "questionId": 1,
      "isCorrect": true,
      "userAnswer": "The process by which plants convert light energy into chemical energy",
      "timeSpent": 30000,
      "scoreAchieved": 100,
      "confidence": 0.9
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "questionSet": {
    "id": 1,
    "name": "Biology Chapter 1",
    "overallMasteryScore": 80,
    "understandScore": 90,
    "useScore": 75,
    "exploreScore": 65,
    "nextReviewAt": "2025-06-03T10:00:00.000Z",
    "currentIntervalDays": 7,
    "lastReviewedAt": "2025-05-27T10:00:00.000Z",
    "reviewCount": 4
  }
}
```

#### Evaluate Answer

Evaluates a single answer to a question.

```
POST /api/evaluation/answer
```

**Request Body:**

```json
{
  "questionId": 1,
  "userAnswer": "The process by which plants convert light energy into chemical energy",
  "updateMastery": true,
  "timeSpent": 30000,
  "confidence": 0.9
}
```

**Response:**

```json
{
  "isCorrect": true,
  "explanation": "Correct! Photosynthesis is indeed the process by which plants convert light energy into chemical energy.",
  "scoreAchieved": 100,
  "questionSet": {
    "id": 1,
    "name": "Biology Chapter 1",
    "overallMasteryScore": 80,
    "understandScore": 90,
    "useScore": 75,
    "exploreScore": 65
  }
}
```

### Spaced Repetition Algorithm

The Question Set-Level Spaced Repetition system uses a modified version of the SM-2 algorithm with the following key components:

1. **U-U-E Framework**: Questions are categorized into three learning stages:
   - **Understand**: Initial comprehension of concepts
   - **Use**: Application of concepts in various contexts
   - **Explore**: Deep exploration and connection of concepts

2. **Question Prioritization**: Questions are prioritized based on:
   - Current U-U-E focus
   - Previous performance (correct/incorrect answers)
   - Difficulty score
   - Time since last review

3. **Interval Calculation**: The interval between reviews is calculated based on:
   - Overall mastery score
   - Performance in the last review
   - Current interval
   - Forgetting curve effect

4. **Mastery Scoring**: Mastery scores are calculated for each U-U-E stage and combined for an overall mastery score.

This system ensures that users review material at optimal intervals for long-term retention and understanding.

### AI-Assisted Question Generation

The API supports AI-assisted question generation with the U-U-E framework:

```
POST /api/ai/generate-questions
```

**Request Body:**

```json
{
  "sourceText": "Text content to generate questions from",
  "questionCount": 5,
  "folderId": 1,
  "questionSetName": "New Question Set",
  "questionTypes": ["multiple-choice", "short-answer"],
  "difficulty": "medium",
  "uueFocusDistribution": {
    "Understand": 0.4,
    "Use": 0.4,
    "Explore": 0.2
  }
}
```

**Response:**

```json
{
  "questionSet": {
    "id": 5,
    "name": "New Question Set",
    "questions": [
      {
        "id": 20,
        "text": "What is the main concept described in the text?",
        "answer": "The correct answer",
        "questionType": "multiple-choice",
        "options": ["Option A", "Option B", "The correct answer", "Option D"],
        "uueFocus": "Understand",
        "difficultyScore": 0.5,
        "conceptTags": ["concept1", "concept2"]
      }
    ]
  },
  "metadata": {
    "processingTime": "2.3s",
    "model": "gpt-4",
    "sourceTextLength": 1500
  }
}
```
### Analytics and Statistics

The API provides endpoints for retrieving analytics and statistics about user learning progress:

#### Get Review Statistics

```
GET /api/reviews/stats
```

**Response:**

```json
{
  "totalReviews": 120,
  "totalQuestionSets": 15,
  "averageMasteryScore": 78.5,
  "masteryByStage": {
    "Understand": 85.2,
    "Use": 76.8,
    "Explore": 65.3
  },
  "reviewTrend": [
    {
      "date": "2025-05-20",
      "reviewCount": 12,
      "averageScore": 75.3
    },
    {
      "date": "2025-05-21",
      "reviewCount": 8,
      "averageScore": 77.1
    }
  ],
  "masteryOverTime": [
    {
      "date": "2025-05-01",
      "overallMasteryScore": 65.2,
      "understandScore": 70.5,
      "useScore": 62.1,
      "exploreScore": 55.8
    },
    {
      "date": "2025-05-15",
      "overallMasteryScore": 72.8,
      "understandScore": 78.3,
      "useScore": 70.2,
      "exploreScore": 62.4
    }
  ]
}
```

#### Get Question Set Progress

```
GET /api/questionsets/:questionSetId/progress
```

**Response:**

```json
{
  "questionSet": {
    "id": 1,
    "name": "Biology Chapter 1",
    "overallMasteryScore": 80,
    "understandScore": 90,
    "useScore": 75,
    "exploreScore": 65,
    "reviewCount": 8,
    "currentIntervalDays": 7,
    "nextReviewAt": "2025-06-03T10:00:00.000Z"
  },
  "masteryOverTime": [
    {
      "date": "2025-04-15",
      "overallMasteryScore": 60,
      "understandScore": 70,
      "useScore": 55,
      "exploreScore": 45
    },
    {
      "date": "2025-05-27",
      "overallMasteryScore": 80,
      "understandScore": 90,
      "useScore": 75,
      "exploreScore": 65
    }
  ],
  "questionStats": [
    {
      "uueFocus": "Understand",
      "count": 10,
      "averageScore": 90,
      "correctAnswerRate": 0.85
    },
    {
      "uueFocus": "Use",
      "count": 8,
      "averageScore": 75,
      "correctAnswerRate": 0.7
    },
    {
      "uueFocus": "Explore",
      "count": 5,
      "averageScore": 65,
      "correctAnswerRate": 0.6
    }
  ]
}
```

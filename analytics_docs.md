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

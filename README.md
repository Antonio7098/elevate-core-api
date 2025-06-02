# Elevate Core API

This is the backend API for the **Elevate** application, an AI-powered learning platform designed to help users create personalized quizzes from their study materials and master subjects through spaced repetition.

This Core API is responsible for:
- User authentication and authorization
- Content management (folders, question sets, questions)
- Spaced repetition system for optimal learning
- Secure gateway to the Python-based AI service for question generation and answer evaluation

---

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Testing:** 
  - Jest (unit & integration tests)
  - Supertest (API testing)
  - Prisma Client Mock for database testing
- **AI Service:**
  - Python Flask-based AI service
  - Gemini 1.5 Flash model for question generation and evaluation
  - Secure API key authentication
- **Code Quality:**
  - ESLint
  - Prettier
  - TypeScript type checking
- **Package Manager:** npm

---

## Project Setup

### Prerequisites

-   Node.js (v18.x or later recommended)
-   npm (comes with Node.js)
-   PostgreSQL (running locally or accessible via a connection string)
-   Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd elevate-core-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. Copy the contents of `.env.example` (if you create one) or use the structure below:
    ```env
    # ===== Server Configuration =====
    PORT=3000
    NODE_ENV=development  # 'production' or 'development'
    
    # ===== Database Configuration =====
    DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/your_database_name"
    
    # ===== Authentication =====
    JWT_SECRET=your-very-strong-secret-key-here
    JWT_EXPIRES_IN=24h  # e.g., 1h, 7d, 30d
    
    # ===== CORS Configuration =====
    ALLOWED_ORIGINS=http://localhost:3001  # Comma-separated for multiple origins
    
    # ===== AI Service Configuration =====
    AI_SERVICE_BASE_URL=http://localhost:8000  # URL of the Python AI service
    AI_SERVICE_API_KEY=your-ai-service-api-key  # API key for authenticating with the AI service
    AI_SERVICE_API_VERSION=v1  # API version for the AI service
    
    # ===== Logging =====
    LOG_LEVEL=debug  # debug, info, warn, error
    
    # ===== Rate Limiting =====
    RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
    RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window per IP
    ```
    
    **Important Notes:**
    - Replace all placeholders with your actual values
    - Never commit the `.env` file to version control (it's in `.gitignore` by default)
    - For production, use environment-specific configuration files or a secret management service
    - The AI service API key should be kept secure and rotated periodically

4.  **Run database migrations:**
    This will set up your database schema based on the Prisma schema file.
    ```bash
    npx prisma migrate dev --schema=./src/db/prisma/schema.prisma
    ```
    *(If you move your `prisma` folder to the root, you can omit the `--schema` flag in the future.)*

### Running the Server

-   **Development Mode (with auto-restart on file changes):**
    ```bash
    npm run dev
    ```
    The server will typically start on `http://localhost:3000` (or the `PORT` specified in your `.env`).

-   **Production Mode:**
    ```bash
    npm run build
    npm start
    ```

---

---

## Key Learning Systems

This section details the core mechanisms that drive the personalized learning experience in Elevate.

### Spaced Repetition System (V2 - Question Set Level)

Elevate employs an advanced spaced repetition system (SRS) designed to optimize learning and retention at the **Question Set** level. This V2 system moves beyond individual question tracking to provide a more holistic view of a user's mastery over a collection of related concepts.

**Key Characteristics:**

*   **Set-Level Mastery:** Instead of tracking mastery for each question independently, the system primarily focuses on the user's overall understanding and recall of an entire Question Set.
*   **U-U-E Scoring:** Each Question Set's progress is measured across three dimensions of learning:
    *   **Understand (`understandScore`):** Basic comprehension and recall of facts.
    *   **Use (`useScore`):** Ability to apply knowledge in familiar contexts.
    *   **Explore (`exploreScore`):** Capacity to synthesize, analyze, and apply knowledge in novel situations or make connections.
    *   These scores (0-100) are updated based on performance during review sessions.
*   **Overall Set Mastery (`currentTotalMasteryScore`):** A composite score reflecting the overall mastery of the Question Set.
*   **Forgetting Curve (`currentForgottenPercentage`):** An estimate of how much content from the set might have been forgotten.
*   **Review Scheduling:** The `nextReviewAt` date for a Question Set is determined by its current mastery scores and performance history, ensuring that users revisit material at optimal intervals to combat forgetting.

### Dashboard and Progress Tracking

The user dashboard provides insights into their learning journey, reflecting the Question Set-Level SR V2 metrics.

*   **Endpoint:** `GET /api/reviews/stats`
*   **Key Statistics Provided:**
    *   `totalSets`: Total number of question sets created by the user.
    *   `masteredSets`: Number of sets where a high level of mastery has been achieved.
    *   `progressingSets`: Sets actively being learned.
    *   `newSets`: Sets not yet reviewed.
    *   `dueSets`: Number of sets currently due for review.
    *   `avgScores`: Average U-U-E scores across all relevant sets.
    *   `reviewStreak`: Current consecutive days of review activity.
    *   `reviewedToday`: Whether the user has completed a review session today.
    *   `totalReviews`: Total number of review sessions completed.

### Review Session Question Selection Algorithm

### Statistics and History Endpoints

New endpoints provide detailed statistics and history for Question Sets and Folders, supporting features like mastery over time graphs and review frequency tracking.

- **`GET /api/stats/questionsets/:setId/details`**: Retrieves detailed statistics for a specific Question Set, including its complete mastery history (timestamps and UUE scores), total review sessions, review dates, and current spaced repetition data (e.g., `currentIntervalDays`, `nextReviewAt`).
- **`GET /api/stats/folders/:folderId/details`**: Retrieves detailed statistics for a specific Folder, including its aggregated mastery history and a summary of its Question Sets (name, current mastery, next review date), and total review sessions conducted for sets within that folder.

When a user starts a review session for a due Question Set (e.g., via `GET /api/reviews/today/:questionSetId/questions`), the system uses a sophisticated algorithm to select and prioritize questions:

1.  **Identify Due Question Set:** The user typically selects a Question Set that is due for review.
2.  **Fetch Question Set Data:** The system retrieves the Question Set, including all its questions and their historical performance data (e.g., recent answers).
3.  **Determine Current U-U-E Focus for the Set:** Based on the Question Set's current `understandScore`, `useScore`, and `exploreScore`, the system determines the primary learning stage for the set (e.g., if "Understand" is mastered, the focus shifts to "Use").
4.  **Prioritize Individual Questions:** Each question within the set is assigned a priority score based on several factors:
    *   **Alignment with Set's Current U-U-E Focus:** Questions matching the set's current U-U-E learning stage (e.g., "Understand," "Use," or "Explore," as defined per question or inherited from the set) receive higher priority.
    *   **Performance History:** Questions answered incorrectly or less confidently in the past are prioritized.
    *   **Time Since Last Review:** While the primary review interval is set-level, individual question performance can influence its likelihood of appearing.
    *   **New vs. Seen Questions:** New questions or those less frequently seen might be prioritized to ensure coverage.
5.  **Serve Prioritized Questions:** The API then returns a list of questions for the review session, ordered by this priority.

This ensures that review sessions are targeted, efficient, and adapt to the user's current learning stage within each Question Set.

---

## API Endpoints

The API base path is `/api`.

### Authentication (`/api/auth`)

-   **`POST /register`**: Register a new user.
    -   **Body:** `{ "email": "user@example.com", "password": "password123" }`
    -   **Response:** `{ "token": "...", "user": { "id": 1, "email": "..." } }`
-   **`POST /login`**: Log in an existing user.
    -   **Body:** `{ "email": "user@example.com", "password": "password123" }`
    -   **Response:** `{ "token": "...", "user": { "id": 1, "email": "..." } }`

### Users (`/api/users`)

-   **`GET /profile`**: Get the logged-in user's profile (Protected Route).
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** `{ "id": 1, "email": "..." }`

### Folders (`/api/folders`)

All folder routes are protected and require authentication.
-   **`POST /`**: Create a new folder.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** `{ "name": "My New Folder", "description": "Optional description" }`
    -   **Response:** The newly created folder object.
-   **`GET /`**: Get all folders for the authenticated user.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of folder objects.
-   **`GET /:id`**: Get a specific folder by ID.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** The folder object if it belongs to the user.
-   **`PUT /:id`**: Update a specific folder.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** `{ "name": "Updated Folder Name", "description": "Updated description" }`
    -   **Response:** The updated folder object.
-   **`DELETE /:id`**: Delete a specific folder.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** 204 No Content on success.

### Question Sets (`/api/folders/:folderId/questionsets`)

All question set routes are protected and require authentication.
-   **`POST /`**: Create a new question set within a folder.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** `{ "name": "My New Question Set" }`
    -   **Response:** The newly created question set object.
-   **`GET /`**: Get all question sets within a specific folder.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of question set objects.
-   **`GET /:id`**: Get a specific question set by ID.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** The question set object if it belongs to the user.
-   **`PUT /:id`**: Update a specific question set.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** `{ "name": "Updated Question Set Name" }`
    -   **Response:** The updated question set object.
-   **`DELETE /:id`**: Delete a specific question set.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** 204 No Content on success.

### Questions (`/api/questionsets/:setId/questions` and `/api/questions/:id`)

All question routes are protected and require authentication.

-   **`POST /`** (within a question set, e.g., `/api/questionsets/:setId/questions`): Create a new question within a specific question set.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:**
        ```json
        {
          "text": "What is the capital of France?",
          "answer": "Paris",
          "questionType": "short_answer", // e.g., 'multiple_choice', 'short_answer', 'true_false'
          "options": ["Paris", "London", "Berlin", "Madrid"], // Primarily for 'multiple_choice' type
          "uueFocus": "Understand", // Optional: 'Understand', 'Use', 'Explore'
          "totalMarksAvailable": 2, // Optional, defaults to 1
          "markingCriteria": [ // Optional, JSON array
            {"criterion": "Correct city name", "marks": 1},
            {"criterion": "Correct spelling", "marks": 1}
          ]
        }
        ```
    -   **Response:** The newly created question object, including `totalMarksAvailable` and `markingCriteria`.

-   **`GET /`** (e.g., `/api/folders/:folderId/questionsets/:setId/questions`): Get all questions within a specific question set.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of question objects. Each object will include `totalMarksAvailable` and `markingCriteria`.
        ```json
        [
          {
            "id": 1,
            "text": "What is the capital of France?",
            "answer": "Paris",
            "questionType": "short_answer",
            "options": [],
            "uueFocus": "Understand",
            "totalMarksAvailable": 2,
            "markingCriteria": [
              {"criterion": "Correct city name", "marks": 1},
              {"criterion": "Correct spelling", "marks": 1}
            ],
            "questionSetId": 1,
            "createdAt": "2023-10-01T10:00:00.000Z",
            "updatedAt": "2023-10-01T10:00:00.000Z"
          },
          {
            "id": 2,
            "text": "What is 2 + 2?",
            "answer": "4",
            "questionType": "short_answer",
            "options": [],
            "uueFocus": "Understand",
            "totalMarksAvailable": 1,
            "markingCriteria": null,
            "questionSetId": 1,
            "createdAt": "2023-10-01T10:05:00.000Z",
            "updatedAt": "2023-10-01T10:05:00.000Z"
          }
        ]
        ```

-   **`GET /:id`**: Get a specific question by its ID.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** The question object.
        ```json
        {
          "id": 1,
          "text": "What is the capital of France?",
          "answer": "Paris",
          "questionType": "short_answer",
          "options": ["Paris", "London", "Berlin", "Madrid"], // Will be null or empty if not applicable
          "uueFocus": "Understand",
          "totalMarksAvailable": 2,
          "markingCriteria": [
            {"criterion": "Correct city name", "marks": 1},
            {"criterion": "Correct spelling", "marks": 1}
          ],
          "questionSetId": 1,
          "createdAt": "2023-10-01T10:00:00.000Z",
          "updatedAt": "2023-10-01T10:00:00.000Z"
        }
        ```

-   **`PUT /:id`**: Update an existing question.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** (Provide only the fields to update)
        ```json
        {
          "text": "What is the official language of France?",
          "answer": "French",
          "totalMarksAvailable": 1,
          "markingCriteria": [{"criterion": "Correct language", "marks": 1}]
        }
        ```
    -   **Response:** The updated question object, including any changed fields like `totalMarksAvailable` and `markingCriteria`.

-   **`DELETE /:id`**: Delete a question.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** Success message (e.g., 204 No Content).

### Reviews & Spaced Repetition (`/api/reviews`)

These endpoints manage the review process based on the Spaced Repetition System.

-   **`GET /today`**: Get all question sets due for review today for the authenticated user.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of Question Set objects that are due.
-   **`GET /today/:questionSetId/questions`**: Get prioritized questions for a specific due question set to start a review session.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of Question objects, prioritized for the review session.
-   **`POST /`**: Submit review outcomes for a completed session.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:**
        ```json
        {
          "questionSetId": "string",
          "outcomes": [
            {
              "questionId": "string",
              "scoreAchieved": "number (0-5)", 
              "userAnswerText": "string (optional)",
              "uueFocus": "string ('Understand'|'Use'|'Explore')"
            }
          ],
          "sessionDurationSeconds": "number"
        }
        ```
    -   **Response:** The updated Question Set object with new mastery scores and next review date.
-   **`GET /stats`**: Get learning statistics for the authenticated user.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An object containing various progress statistics (see "Dashboard and Progress Tracking" section for details).

### Stats (`/api/stats`)

All stats routes are protected and require authentication.

-   **`GET /questionsets/:setId/details`**: Get detailed statistics for a specific Question Set.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Params:** `setId` (integer)
    -   **Response:** An object containing `masteryHistory`, `totalReviews`, `reviewDates`, `currentSpacedRepetitionDetails` (like `currentIntervalDays`, `nextReviewAt`, `currentForgottenPercentage`, UUE scores).

-   **`GET /folders/:folderId/details`**: Get detailed statistics for a specific Folder.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Params:** `folderId` (integer)
    -   **Response:** An object containing `masteryHistory` for the folder, `totalReviewSessionsInFolder`, and `questionSetSummaries` (list of objects with `id`, `name`, `currentTotalMasteryScore`, `nextReviewAt` for each set in the folder).

### AI Service Integration (`/api/ai`)

These endpoints interact with the Python-based AI service.

-   **`POST /generate-questions`**: Generate questions from source text.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:**
        ```json
        {
          "sourceText": "Your study text here...",
          "folderId": 1,
          "questionCount": 5,
          "questionTypes": ["multiple-choice", "true-false", "short-answer"],
          "difficulty": "medium",
          "questionSetName": "Optional custom name"
        }
        ```
    -   **Response:** A new question set object with the generated questions.

-   **`POST /evaluate-answer`**: Evaluate a user's answer to a question, potentially using AI.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:**
        ```json
        {
          "questionId": 123,
          "userAnswer": "The user's submitted answer.",
          "updateMastery": false // Optional, defaults true, but mastery updates for single eval are de-emphasized here
        }
        ```
    -   **Logic:** 
        - Fetches the question, including its `marksAvailable` (defaults to 1 if not set).
        - If AI service is available, it constructs a detailed request for the AI (including `questionText`, `userAnswer`, `marksAvailable`, `questionType`, etc.).
        - The AI returns feedback, a raw score, and a suggested answer.
        - `scoreAchieved` is calculated based on the AI's raw score and the question's `marksAvailable`.
        - If AI is not available or for simpler types, basic local evaluation is performed.
        - Records the `UserQuestionAnswer` with `scoreAchieved`.
        - Updates basic question statistics (e.g., `lastAnswerCorrect`).
    -   **Response:**
        ```json
        {
          "evaluation": {
            "isCorrect": true,
            "score": 0.9, // Raw score from AI or 1/0 from basic eval
            "feedback": "Your answer is mostly correct...",
            "explanation": "A more complete answer would be...", // Suggested correct answer from AI
            "marksAvailable": 1, // The total marks for this question
            "scoreAchieved": 1, // The actual marks awarded to the user for this question
            "pendingEvaluation": false
          }
        }
        ```

-   **`POST /chat`**: Chat with AI about study materials.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:**
        ```json
        { 
          "message": "Your question or message to the AI",
          "context": { 
            "folderName": "Optional folder name", 
            "questionSetName": "Optional question set name",
            "questionText": "Optional specific question text"
          }
        }
        ```
    -   **Response:** AI-generated chat response.

### Reviews & Spaced Repetition (`/api/reviews`)

All review routes are protected and require authentication.

-   **`GET /today`**: Get question sets due for review today based on the spaced repetition schedule.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of question set objects due for review.

-   **`POST /`**: Submit the outcomes of a completed review session.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body (`FrontendReviewSubmission`):
        ```json
        {
          "questionSetId": "1",
          "outcomes": [
            {
              "questionId": "101",
              "userAnswer": "User's answer for question 101",
              "scoreAchieved": 1, // Raw marks achieved for this question
              "uueFocus": "Understand" // Frontend determined UUE focus for this answer
            },
            {
              "questionId": "102",
              "userAnswer": "User's answer for question 102",
              "scoreAchieved": 0,
              "uueFocus": "Use"
            }
            // ... more outcomes
          ],
          "timeSpent": 1200 // Total time in seconds for the session
        }
        ```
    -   **Logic:**
        - For each outcome, fetches the question's `marksAvailable` from the database.
        - Calculates UUE category scores (Understand, Use, Explore) based on `scoreAchieved` vs `marksAvailable`.
        - Calculates an overall weighted score for the session.
        - Creates a `UserQuestionSetReview` record.
        - Calls `calculateQuestionSetNextReview` service, which updates `QuestionSet` mastery scores and `nextReviewAt`, and also records each `UserQuestionAnswer` (including the `scoreAchieved` raw marks).
    -   **Response:** The updated `QuestionSet` object with new mastery scores and next review date.

-   **`GET /stats`**: Get review statistics for the user (e.g., overall progress, mastery levels).
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** User's progress summary.

---

## Database Schema Notes

The database schema is managed by Prisma and defined in `src/db/prisma/schema.prisma`.

Key models include:
- `User`
- `Folder`
- `QuestionSet`
- `Question`
- `UserQuestionAnswer`
- `UserQuestionSetReview`

### `Question.marksAvailable`

The `Question` model has an important optional field:
-   `marksAvailable: Int?`

This field stores the total possible marks a question is worth (e.g., 1, 2, 5). It is crucial for:
-   The AI evaluation service, which takes `marksAvailable` into account when determining a score.
-   Calculating the user's percentage score for a question (`scoreAchieved / marksAvailable`).
-   Calculating overall session scores and mastery levels accurately.

If not explicitly set, the system often defaults to `1` mark for a question during evaluations.

---

## Development & Database Management

### Running the Server

-   **Development Mode (with auto-restart on file changes):**
    ```bash
    npm run dev
    ```
    The server will typically start on `http://localhost:3000` (or the `PORT` specified in your `.env`).

-   **Production Mode:**
    ```bash
    npm run build
    npm start
    ```

### Database Migrations

Run database migrations using Prisma:
```bash
npx prisma migrate dev --schema=./src/db/prisma/schema.prisma
```

### Updating `marksAvailable` for Existing Questions

To ensure all existing questions have a default value for the `marksAvailable` field (e.g., if they were created before this field was emphasized), a script is provided:

-   **Script location:** `scripts/updateMarksAvailable.ts`
-   **Purpose:** Finds all questions where `marksAvailable` is `null` and updates it to `1`.
-   **To run:**
    ```bash
    npm run db:update-marks
    ```

---

## Project Structure (Simplified)

elevate-core-api/
├── .env                  # Environment variables (ignored by Git)
├── node_modules/         # Dependencies
├── prisma/               # Prisma schema and migrations (if at root)
├── src/
│   ├── app.ts            # Main Express application setup
│   ├── server.ts         # Server entry point (starts the app)
│   ├── config/           # Configuration files (e.g., for .env loading)
│   ├── controllers/      # Request handlers (business logic)
│   │   ├── auth.controller.ts     # Authentication logic
│   │   ├── folder.controller.ts   # Folder management
│   │   ├── question.controller.ts # Question and AI generation
│   │   ├── questionset.controller.ts # Question set management
│   │   └── user.controller.ts     # User profile management
│   ├── db/
│   │   └── prisma/       # Prisma schema and migrations (current location)
│   ├── middleware/       # Express middleware (auth, error handling, validation)
│   │   ├── auth.middleware.ts     # JWT authentication
│   │   └── validation.ts          # Request validation
│   ├── routes/           # API route definitions
│   │   ├── ai.ts         # AI-related routes
│   │   ├── auth.ts       # Authentication routes
│   │   ├── folder.ts     # Folder management routes
│   │   ├── question.ts   # Question management routes
│   │   ├── questionset.ts # Question set routes
│   │   └── user.ts       # User profile routes
│   ├── services/         # Business logic services (if needed for complex tasks)
│   └── utils/            # Utility functions
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json         # TypeScript compiler options
│   └── README.md             # This file

## Testing

### Running Tests

Run the test suite using the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test -- path/to/test/file.test.ts

# Run tests with coverage
npm run test:coverage
```

### Test Structure

Tests are organized to match the source code structure:

```
tests/
  ├── integration/    # Integration tests for API endpoints
  ├── services/       # Service layer tests
  ├── controllers/    # Controller tests
  ├── middleware/     # Middleware tests
  └── utils/          # Utility function tests
```

### Mocking

- **Database**: Uses `@prisma/client` mock for database operations
- **External Services**: Uses `nock` for HTTP request mocking
- **Authentication**: Test utilities for generating JWTs and mocking authenticated requests

### Test Coverage

To generate and view the test coverage report:

```bash
npm run test:coverage
```

This will create a `coverage` directory with detailed coverage reports in HTML format. Open `coverage/lcov-report/index.html` in a browser to view the full report.

## Deployment

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- AI Service (if using AI features)
- Environment variables configured

### Production Build

1. Install production dependencies:
   ```bash
   npm ci --only=production
   ```

2. Build the TypeScript code:
   ```bash
   npm run build
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate deploy --schema=./src/db/prisma/schema.prisma
   ```

4. Start the production server:
   ```bash
   npm start
   ```

### Containerization with Docker

A `Dockerfile` is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t elevate-core-api .

# Run the container
docker run -p 3000:3000 --env-file .env elevate-core-api
```

### Environment Variables for Production

Ensure these production-specific environment variables are set:

```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_strong_secret
AI_SERVICE_API_KEY=your_production_ai_key
# Other production-specific variables
```

### Monitoring and Logging

- **Logs**: All logs are written to `logs/` directory
- **Health Check**: `GET /health` endpoint for monitoring
- **Error Tracking**: Integrate with services like Sentry or New Relic

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

1. Install development dependencies:
   ```bash
   npm install
   ```

2. Start the development server with hot-reload:
   ```bash
   npm run dev
   ```

3. Run linter:
   ```bash
   npm run lint
   ```

4. Format code:
   ```bash
   npm run format
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Check if the database user has proper permissions

2. **AI Service Connection**
   - Verify `AI_SERVICE_BASE_URL` is correct
   - Check if the AI service is running and accessible
   - Verify the API key is valid

3. **JWT Authentication**
   - Ensure `JWT_SECRET` is set and consistent
   - Check token expiration time
   - Verify token in the `Authorization` header

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [JWT](https://jwt.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- And all other open-source projects used in this project

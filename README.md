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

### Questions (`/api/folders/:folderId/questionsets/:setId/questions`)

All question routes are protected and require authentication.
-   **`POST /`**: Create a new question within a question set.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** `{ "text": "What is 2+2?", "answer": "4", "questionType": "flashcard", "options": [] }`
    -   **Response:** The newly created question object.
-   **`GET /`**: Get all questions within a specific question set.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of question objects.
-   **`GET /:id`**: Get a specific question by ID.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** The question object if it belongs to the user.
-   **`PUT /:id`**: Update a specific question.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** `{ "text": "Updated question text", "answer": "Updated answer" }`
    -   **Response:** The updated question object.
-   **`DELETE /:id`**: Delete a specific question.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** 204 No Content on success.

## AI Service Integration

The AI service is a Python Flask-based microservice that handles natural language processing tasks. The Core API communicates with this service for question generation and answer evaluation.

### Endpoints

#### `POST /api/ai/generate-questions`
Generate questions from source text.

**Headers:**
- `Authorization: Bearer <YOUR_JWT_TOKEN>`
- `Content-Type: application/json`

**Request Body:**
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

**Response:**
```json
{
  "questionSet": {
    "id": 123,
    "name": "Questions from Source - May 25, 2025",
    "folderId": 1,
    "createdAt": "2025-05-25T07:30:00.000Z",
    "updatedAt": "2025-05-25T07:30:00.000Z"
  },
  "questions": [
    {
      "id": 456,
      "text": "What is the main concept discussed in the text?",
      "answer": "The main concept is...",
      "questionType": "multiple-choice",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "explanation": "The text primarily discusses..."
    }
  ]
}
```

#### `POST /api/ai/chat`
Chat with the AI about study materials.

**Headers:**
- `Authorization: Bearer <YOUR_JWT_TOKEN>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "Can you explain this concept further?",
  "context": {
    "questionSets": [
      {
        "id": 1,
        "name": "Biology 101",
        "questions": [
          {"text": "What is the function of mitochondria?", "answer": "Generate energy in the form of ATP"}
        ]
      }
    ],
    "userLevel": "beginner"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "message": "Mitochondria are known as the 'powerhouse of the cell'...",
    "references": [
      {"text": "Biology Textbook, Chapter 5", "source": "Campbell Biology"}
    ],
    "suggestedQuestions": [
      "How does ATP production work?",
      "What is the structure of mitochondria?"
    ]
  },
  "metadata": {
    "model": "gemini-1.5-flash-latest",
    "processingTime": "1.23s",
    "tokensUsed": 145
  }
}
```

#### `POST /api/ai/evaluate-answer`
Evaluate a user's answer to a question.

**Headers:**
- `Authorization: Bearer <YOUR_JWT_TOKEN>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "questionContext": {
    "questionId": "bio1",
    "questionText": "What is the function of mitochondria?",
    "expectedAnswer": "Generate energy in the form of ATP",
    "questionType": "short-answer"
  },
  "userAnswer": "They produce energy for the cell",
  "context": {
    "questionSetName": "Biology 101",
    "folderName": "Science"
  }
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "isCorrect": true,
    "isPartiallyCorrect": true,
    "score": 0.9,
    "feedback": "Your answer is correct but could be more specific. Mitochondria generate energy in the form of ATP.",
    "suggestedCorrectAnswer": "Mitochondria generate energy in the form of ATP (adenosine triphosphate)."
  },
  "metadata": {
    "model": "gemini-1.5-flash-latest",
    "processingTime": "1.45s",
    "confidenceScore": 0.95
  }
}
```
          "questionType": "flashcard",
          "options": [],
          "questionSetId": 123,
          "createdAt": "2025-05-25T07:30:00.000Z",
          "updatedAt": "2025-05-25T07:30:00.000Z"
        },
        // Additional questions...
      ]
    }
    ```

    **How it works:**
    1. The API receives source text from which questions should be generated
    2. It processes the text using AI algorithms to identify key concepts and create relevant questions
    3. A new question set is created in the specified folder
    4. The generated questions are saved to the database and linked to the question set
    5. The complete question set with all questions is returned in the response

-   **`POST /chat`**: Chat with AI about study materials.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** 
    ```json
    { 
      "message": "Your question or message to the AI",
      "questionSetId": 123, // Optional: Provide context from a specific question set
      "folderId": 1 // Optional: Provide context from a specific folder
    }
    ```
    -   **Response:** The AI's response to your message.
    ```json
    {
      "response": "Here's an explanation of the concept you asked about...",
      "context": "Based on your question set 'Biology 101' with 15 questions."
    }
    ```

    **How it works:**
    1. The API receives your message and optional context (question set or folder)
    2. It verifies that you have access to the provided context (if any)
    3. The message is processed by the AI, which generates a contextually relevant response
    4. If context was provided, the AI incorporates information from your question sets or folders
    5. The AI response is returned, along with any context information that was used

### Reviews & Spaced Repetition (`/api/reviews`)

All review routes are protected and require authentication.

-   **`GET /today`**: Get questions due for review today.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** An array of questions that are due for review today.
    ```json
    {
      "count": 5,
      "questions": [
        {
          "id": 1,
          "text": "What is spaced repetition?",
          "questionType": "multiple-choice",
          "options": ["A learning technique", "A memorization method", "A scheduling system"],
          "masteryScore": 2,
          "nextReviewAt": "2023-06-01T12:00:00Z",
          "questionSetId": 1,
          "questionSetName": "Learning Techniques",
          "folderId": 1,
          "folderName": "Study Methods"
        },
        // More questions...
      ]
    }
    ```

-   **`POST /`**: Submit a review for a question.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** 
    ```json
    { 
      "questionId": 1,
      "answeredCorrectly": true,
      "userAnswer": "Optional user's answer text"
    }
    ```
    -   **Response:** The updated question with review results.
    ```json
    {
      "question": {
        "id": 1,
        "text": "What is spaced repetition?",
        "masteryScore": 3,
        "nextReviewAt": "2023-06-08T12:00:00Z",
        // Other question properties...
      },
      "reviewResult": {
        "answeredCorrectly": true,
        "oldMasteryScore": 2,
        "newMasteryScore": 3,
        "nextReviewAt": "2023-06-08T12:00:00Z"
      }
    }
    ```

-   **`GET /stats`**: Get review statistics for the authenticated user.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Response:** Statistics about the user's review progress.
    ```json
    {
      "totalQuestions": 50,
      "reviewedQuestions": 30,
      "masteredQuestions": 15,
      "dueQuestions": 8,
      "questionsByMastery": [
        { "level": 0, "count": 20 },
        { "level": 1, "count": 5 },
        { "level": 2, "count": 10 },
        { "level": 3, "count": 5 },
        { "level": 4, "count": 7 },
        { "level": 5, "count": 3 }
      ],
      "completionRate": 30
    }
    ```

    **How it works:**
    1. The spaced repetition system uses a simplified version of the SM-2 algorithm
    2. Questions are assigned a mastery score (0-5) that increases when answered correctly and decreases when answered incorrectly
    3. The next review date is calculated based on the mastery score - higher mastery means longer intervals between reviews
    4. Questions are prioritized for review based on their mastery score and how overdue they are

---

## Scripts

-   `npm run dev`: Starts the server in development mode using `nodemon` and `ts-node`.
-   `npm start`: Starts the server in production mode (after building).
-   `npm run build`: Compiles TypeScript to JavaScript (output to `dist/` folder).
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run format`: Formats the codebase using Prettier.
-   `npx prisma migrate dev`: Runs database migrations.
-   `npx prisma generate`: Generates/updates the Prisma Client.
-   `npx prisma studio`: Opens the Prisma Studio GUI to view/edit database data.

---

## Project Structure (Overview)


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

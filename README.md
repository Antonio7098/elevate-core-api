# Elevate Core API

This is the backend API for the **Elevate** application, an AI-powered learning platform designed to help users create personalized quizzes from their study materials and master subjects through spaced repetition.

This Core API is responsible for user authentication, content management (folders, question sets), managing the spaced repetition logic, and acting as a secure gateway to the Python-based AI service.

---

## Tech Stack

-   **Language:** TypeScript
-   **Framework:** Node.js with Express.js
-   **Database:** PostgreSQL
-   **ORM:** Prisma
-   **Authentication:** JWT (JSON Web Tokens)
-   **Testing:** Jest & Supertest
-   **AI Integration:** Built-in AI simulation (with planned integration to Python AI service)
-   **Package Manager:** npm

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
    # Server Configuration
    PORT=3000

    # Database Configuration
    DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/your_database_name"

    # JWT Configuration
    JWT_SECRET=your-very-strong-secret-key-here
    JWT_EXPIRES_IN=24h # e.g., 1h, 7d, 30d

    # Other Configurations
    NODE_ENV=development # 'production' for live deployment

    # CORS Configuration (Adjust as needed for your frontend)
    ALLOWED_ORIGINS=http://localhost:3001 # Assuming frontend runs on 3001

    # Logging
    LOG_LEVEL=debug
    ```
    **Important:** Replace placeholders with your actual database credentials and choose a strong `JWT_SECRET`. Add `.env` to your `.gitignore` file to keep secrets out of version control.

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

### AI Service Integration (`/api/ai`)

All AI routes are protected and require authentication.
-   **`POST /generate-from-source`**: Generate questions from source text.
    -   **Headers:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
    -   **Body:** 
    ```json
    { 
      "sourceText": "Your study text here...", 
      "folderId": 1, 
      "questionCount": 5,
      "questionSetName": "Optional custom name" // If not provided, a default name will be generated
    }
    ```
    -   **Response:** A newly created question set with AI-generated questions.
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

### (Planned) Reviews & Spaced Repetition (`/api/reviews`)

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
└── README.md             # This file


---

## Contributing


---

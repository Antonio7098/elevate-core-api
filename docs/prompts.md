Integrate Enhanced Question Attributes into Core API

Objective:
Update the Node.js Core API (elevate-core-api) to store and serve new question attributes (totalMarksAvailable and markingCriteria) that are now being provided by the enhanced Python AI Service's /generate-questions endpoint.

Context:
The Python AI Service has been upgraded. Its /generate-questions endpoint now returns a list of questions, where each question object includes:

questionText (string)
answer (string)
options (array of strings, if applicable)
type (string, e.g., "multiple-choice", "short-answer")
uueFocus (string: "Understand", "Use", or "Explore")
difficulty (string or number)
topics (array of strings)
NEW: totalMarksAvailable (number, e.g., 1-5)
NEW: markingCriteria (array of strings, or a single string, detailing how marks are achieved)
The Core API needs to:

Modify its database schema (Question model) to store these new fields.
Update the service responsible for calling the Python AI Service to save these new fields when questions are created.
Ensure these new fields are included in API responses that send question data to the frontend.
Detailed Implementation Steps:

1. Update Prisma Schema (src/db/prisma/schema.prisma):
a.  Navigate to the Question model.
b.  Add the following new fields:
prisma model Question { // ... existing fields ... totalMarksAvailable Int? // Integer, optional, or provide a @default(1) markingCriteria Json? // Using Json type for flexibility (can store string or array of strings) // Alternatively, if it's always an array of strings and your DB supports it well: String[] }
c.  Save the schema.prisma file.

2. Apply Schema Changes & Regenerate Prisma Client:
a.  Run the following command in the elevate-core-api terminal:
bash npx prisma migrate dev --name add_marks_criteria_to_question --schema=src/db/prisma/schema.prisma
(The agent should enter a descriptive name when prompted if --name is not used directly).
b.  After the migration is successful, ensure Prisma Client is regenerated:
bash npx prisma generate --schema=src/db/prisma/schema.prisma

3. Modify AI Orchestration Service (e.g., src/services/aiService.ts or the specific service that handles POST /api/ai/generate-from-source):
a.  Locate the function that calls the Python AI Service's /generate-questions endpoint and then saves the questions to the database.
b.  When this function receives the list of question objects from the Python service response:
i.  For each question object, ensure it now correctly extracts the totalMarksAvailable and markingCriteria fields, in addition to the existing fields.
ii. When creating new Question records in the database (e.g., using prisma.question.create or prisma.question.createMany), include these new totalMarksAvailable and markingCriteria fields in the data payload provided to Prisma.
Example (conceptual for createMany):
typescript // const questionsFromAI = responseFromPythonService.questions; // const questionsToCreate = questionsFromAI.map(q => ({ // text: q.questionText, // answer: q.correctAnswer, // options: q.options, // questionType: q.type, // uueFocus: q.uueFocus, // difficultyScore: q.difficulty, // Assuming conversion if types differ // conceptTags: q.topics, // questionSetId: newQuestionSet.id, // totalMarksAvailable: q.totalMarksAvailable, // NEW // markingCriteria: q.markingCriteria, // NEW // })); // await prisma.question.createMany({ data: questionsToCreate });

4. Update API Responses (Data Transfer Objects / Serialization):
a.  Review all Core API GET endpoints that return Question objects or lists of Question objects. This includes, but may not be limited to:
* GET /api/questionsets/:setId/questions
* GET /api/reviews/question-set/:id (the one that gets prioritized questions)
* GET /api/todays-tasks (which returns lists of questions)
b.  Ensure that these endpoints now include the totalMarksAvailable and markingCriteria fields in the question data sent to the frontend.
c.  Update any relevant TypeScript types/interfaces used for API response structures to include these new fields.

5. Update Tests:
a.  Review and update existing integration tests for the AI question generation flow (the tests for POST /api/ai/generate-from-source or equivalent). Assert that totalMarksAvailable and markingCriteria are correctly saved to the database after questions are generated.
b.  Update tests for the GET endpoints (listed in 4.a) to ensure they now correctly return totalMarksAvailable and markingCriteria as part of the question objects.

Expected Outcome:

The Question table in the database now has columns for totalMarksAvailable and markingCriteria.
When new questions are generated via the AI service, these new attributes are correctly persisted in the database.
Frontend-facing API endpoints that provide question data now include totalMarksAvailable and markingCriteria, making this information available for display in the UI (e.g., on the ReviewSessionPage).
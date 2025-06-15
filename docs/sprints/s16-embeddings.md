# Sprint ##: Backend - Implement Embeddings for RAG Chatbot

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** AI Service & Core API - Creating and Storing Text Embeddings
**Overview:** This sprint focuses on building the foundational data layer for a Retrieval-Augmented Generation (RAG) system. The goal is to generate embeddings for each "chunk" of content within a Learning Blueprint and store them in a way that allows for efficient similarity searches. This will enable the AI chatbot to find the most relevant context for a user's query, leading to faster, cheaper, and more accurate responses.

---

## I. Planned Tasks & To-Do List

*Instructions for the agent: This sprint requires changes to both the Python AI Service and the Node.js Core API. It will also require a decision on a vector database solution.*

- [ ] **Task 1: Choose and Set Up a Vector Database**
    - [ ] **Sub-task 1.1 (Research & Decision):** Decide on the vector database solution.
        * **Option A (Simpler):** Use the `pgvector` extension for your existing PostgreSQL database in Supabase. This keeps your stack simple.
        * **Option B (More Scalable):** Use a dedicated vector database service like Pinecone or Weaviate. This is more powerful but adds another service to manage.
        * **Decision for MVP:** Let's proceed with **`pgvector`** for simplicity.
    - [ ] **Sub-task 1.2 (Setup):** Enable the `pgvector` extension in your Supabase database. This is usually a simple command in the Supabase SQL editor.

- [ ] **Task 2: Update Prisma Schema & Core API**
    - [ ] **Sub-task 2.1 (Schema):** Create a new model `ContentChunkEmbedding` in `schema.prisma`. This table will store the embeddings for each piece of knowledge.
        ```prisma
        // Add this to the top of your schema.prisma
        // This tells Prisma how to handle the vector type from pgvector
        generator client {
          provider = "prisma-client-js"
          previewFeatures = ["postgresqlExtensions"] 
        }

        datasource db {
          provider   = "postgresql"
          url        = env("DATABASE_URL")
          extensions = [vector] // Enable the pgvector extension
        }

        // New Model
        model ContentChunkEmbedding {
          id        Int      @id @default(autoincrement())
          content   String   // The original text of the chunk
          embedding Vector(768) // The vector embedding. Size depends on the model (e.g., 768 for text-embedding-004)
          
          sourceType  String   // e.g., "keyIdea", "useCase", "keyTerm"
          sourceId    String   // The ID from the blueprint (e.g., "F1", "U1")

          userId      Int
          questionSetId Int
          
          questionSet QuestionSet @relation(fields: [questionSetId], references: [id], onDelete: Cascade)
          user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)

          @@index([questionSetId])
        }
        ```
        *Note: The `QuestionSet` model should have `embeddings ContentChunkEmbedding[]` added as a relation.*
    - [ ] **Sub-task 2.2 (Migration):** Run `npx prisma migrate dev --name "feat_embedding_storage"` and regenerate the client.

- [ ] **Task 3: Enhance Python AI Service**
    - [ ] **Sub-task 3.1 (New Endpoint):** Create a new endpoint `POST /api/ai/generate-embeddings`. This endpoint will receive a JSON object containing text chunks (e.g., `{ "F1": "Text of key idea 1", "U1": "Text of use case 1" }`).
    - [ ] **Sub-task 3.2 (Embedding Logic):** The service logic will:
        1.  Iterate through the received text chunks.
        2.  For each chunk, call the Google AI Embedding API (`genai.embed_content`) using an embedding model like `text-embedding-004`.
        3.  Return a JSON object mapping the original chunk IDs to their newly generated embedding vectors (arrays of numbers).

- [ ] **Task 4: Integrate Embedding Generation into Core API**
    - [ ] **Sub-task 4.1:** Modify the `POST /api/ai/deconstruct-source` service function in your Node.js Core API.
    - [ ] **Sub-task 4.2:** After this function successfully receives the "Learning Blueprint" JSON, it must immediately:
        1.  Extract all the text chunks from the blueprint (`keyIdeas`, `useCases`, etc.).
        2.  Call the new `/api/ai/generate-embeddings` endpoint on the Python service with these text chunks.
        3.  Receive the embeddings back from the Python service.
        4.  Save each chunk's text and its corresponding embedding vector into your new `ContentChunkEmbedding` table in the database, linking it to the user and the `QuestionSet`.

- [ ] **Task 5: Implement the RAG Search Logic**
    - [ ] **Sub-task 5.1:** Refactor the `POST /api/ai/chat` service in your Node.js Core API.
    - [ ] **Sub-task 5.2:** When a user sends a message, this service must now perform the RAG flow:
        1.  Call the Python AI Service to get an embedding for the *user's question*.
        2.  Use this question embedding to perform a **vector similarity search** on your `ContentChunkEmbedding` table (using Prisma's `pgvector` functions). This will find the most relevant text chunks from the user's notes.
        3.  Take the top 3-5 most relevant text chunks.
        4.  Pass **only these chunks** as context in the final call to the Python AI chat endpoint.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below, including notes on key files modified and any challenges or decisions made.*

**(Agent will fill this section out as work is completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**

---
**Signed off:** DO NOT PROCEED WITH THE SPRINT UNLESS SIGNED OFF
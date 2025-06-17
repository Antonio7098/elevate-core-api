# Sprint 22: RAG - Conversational Chat Integration

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - RAG-Powered Chat Functionality
**Overview:** This sprint focuses on integrating the RAG-powered chat functionality. It involves implementing the `POST /api/chat/message` endpoint. The Core API will need to fetch relevant `UserMemory` (if applicable, or this might be handled entirely by the AI service), assemble context, and call the AI Service's `/chat` endpoint. The AI service is expected to handle the RAG retrieval and response generation.

---

## I. Planned Tasks & To-Do List

*Instructions for Antonio: Review the proposed tasks below. Modify, add, or remove as needed.*

- [ ] **Task 1: Implement `POST /api/chat/message` Endpoint**
    - Sub-task 1.1: Define route and link to `AiRAGController.handleChatMessage` method.
    - Sub-task 1.2: Implement request validation using `ChatMessageDto` (e.g., `messageContent`, `chatHistory`, context like `blueprintId` or `questionSetId` if chat is context-specific, or general user context).
    - Sub-task 1.3: Ensure user authentication.
- [ ] **Task 2: Develop `AiRAGService.handleChatMessage` Method**
    - Sub-task 2.1: Accept `userId`, `messageContent`, `chatHistory`, and any contextual identifiers from the DTO.
    - Sub-task 2.2: Prepare payload for the AI Service's `/chat` endpoint.
        - This might involve fetching some `UserMemory` elements if the Core API is responsible for providing initial context beyond what the AI service retrieves. (Clarify with AI Service team if Core API needs to send specific `UserMemory` or if AI service handles all `UserMemory` retrieval via RAG).
        - Include `messageContent`, `chatHistory`, and any relevant context IDs (e.g., `blueprintId`, `userId` for the AI service to scope its RAG search).
    - Sub-task 2.3: Implement HTTP call to the internal AI Service's `/chat` endpoint.
        - Handle API key management and AI service error responses.
    - Sub-task 2.4: Receive chat response from the AI Service.
- [ ] **Task 3: Process and Return Chat Response**
    - Sub-task 3.1: Format the AI service's response for the frontend.
    - Sub-task 3.2: Consider if any part of the response needs to be persisted by the Core API (e.g., saving the chat message/response to a `ChatSession` model, though this might be out of scope for initial RAG integration and handled by AI service or frontend).
- [ ] **Task 4: (If Applicable) Define `ChatSession` / `ChatMessage` Prisma Models**
    - Sub-task 4.1: If chat history needs to be persisted by the Core API, define `ChatSession` and `ChatMessage` models.
    - Sub-task 4.2: Update `schema.prisma` and run migrations.
    - Sub-task 4.3: Implement logic in `AiRAGService` to save messages if models are added.
- [ ] **Task 5: Unit/Integration Tests for Chat Endpoint**
    - Sub-task 5.1: Write tests for successful chat message handling and response.
    - Sub-task 5.2: Test error handling (e.g., AI service failure, invalid input).
    - Sub-task 5.3: Test with different contextual parameters.

---

## II. Agent's Implementation Summary & Notes

**(Agent will fill this section as tasks are completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**(Standard review template sections)**

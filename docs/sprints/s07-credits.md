# Sprint ##: Backend - AI Credit & Payment Integration

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Implementing Server-Side Credit Management & Stripe Subscriptions
**Overview:** This sprint focuses on building the backend foundation for tracking AI credit usage and handling user subscriptions via Stripe. The goal is to create the necessary database schema updates, API endpoints to initiate payments, a credit-checking middleware, and a secure webhook handler to manage subscription status.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Initial Setup & Database Schema**
    - [ ] **Sub-task 1.1 (Stripe Setup - Manual):** In the Stripe Dashboard, create a Product (e.g., "Elevate Pro Plan") and a recurring Price. Note the Price ID.
    - [ ] **Sub-task 1.2 (Dependencies):** Install the official Stripe Node.js library: `npm install stripe`.
    - [ ] **Sub-task 1.3 (Environment Variables):** Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and your `STRIPE_PRICE_ID` to the `.env` file.
    - [ ] **Sub-task 1.4 (Prisma Schema):**
        * Update the `User` model to add `aiCredits: Int @default(100)`.
        * Create a new `AiCreditLog` model to track every credit transaction (`actionType`, `creditsUsed`, `userId`, `createdAt`, optional links to `questionSetId`, etc.).
        * Add subscription fields to the `User` model: `stripeCustomerId: String? @unique`, `subscriptionStatus: String?`, `subscriptionId: String? @unique`, `plan: String? @default("free")`.
    - [ ] **Sub-task 1.5 (Migration):** Run `npx prisma migrate dev --name "add_credits_and_payments"` and `npx prisma generate`.

- [ ] **Task 2: Implement Credit Management Logic**
    - [ ] **Sub-task 2.1 (Middleware):** Create a middleware `checkAiCredits(cost: number)`. It will verify if the authenticated user has enough `aiCredits` to perform an action. If not, it returns a `402 Payment Required` error.
    - [ ] **Sub-task 2.2 (Apply Middleware):** Apply the `checkAiCredits` middleware to all AI-related routes (e.g., `POST /api/ai/generate-from-source`, `POST /api/ai/evaluate-answer`).
    - [ ] **Sub-task 2.3 (Service Logic):** In the services that successfully complete an AI action, use a Prisma transaction to decrement the user's `aiCredits` and create a record in the `AiCreditLog`.

- [ ] **Task 3: Implement Stripe Payment Endpoints**
    - [ ] **Sub-task 3.1 (Checkout Endpoint):** Create `POST /api/payments/create-checkout-session`. This service logic will create/retrieve a Stripe Customer for the user and then create a Stripe Checkout Session, returning the session ID to the frontend.
    - [ ] **Sub-task 3.2 (Webhook Endpoint):** Create `POST /api/stripe-webhook`. This endpoint will securely verify the incoming webhook signature from Stripe.
    - [ ] **Sub-task 3.3 (Webhook Logic):** The webhook handler must process key events from Stripe (like `checkout.session.completed`, `customer.subscription.deleted`) and update the user's `subscriptionStatus`, `plan`, and `aiCredits` (e.g., topping up credits for pro users) in the database.

- [ ] **Task 4: Update Authentication & Tests**
    - [ ] **Sub-task 4.1:** Update the `POST /api/auth/login` and user profile endpoints to include the `aiCredits` balance in their responses.
    - [ ] **Sub-task 4.2:** Write integration tests for the new credit middleware and all payment-related endpoints, mocking the Stripe library calls.

---

## II. Agent's Implementation Summary & Notes

**(Agent will fill this section out as work is completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**
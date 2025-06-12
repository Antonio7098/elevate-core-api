# Sprint ##: Backend - Stripe Payment Integration

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Subscription & Payment Logic
**Overview:** This sprint focuses on building the backend foundation for handling user subscriptions via Stripe. The goal is to create the necessary database schema updates, API endpoints to initiate payments, and a secure webhook handler to manage subscription status based on events from Stripe.

---

## I. Planned Tasks & To-Do List

*Instructions for the agent: This sprint involves integrating a third-party service (Stripe). Ensure all secret keys are handled via environment variables.*

- [ ] **Task 1: Initial Setup & Database Schema**
    - [ ] **Sub-task 1.1 (Stripe Setup - Manual Task):** In the Stripe Dashboard, create your Products (e.g., "Elevate Pro Plan") and Prices (e.g., "£10/month"). Note the Price ID (e.g., `price_...`).
    - [ ] **Sub-task 1.2 (Dependencies):** Install the official Stripe Node.js library: `npm install stripe`.
    - [ ] **Sub-task 1.3 (Environment Variables):** Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and your `STRIPE_PRICE_ID` to the `.env` file.
    - [ ] **Sub-task 1.4 (Prisma Schema):** In `schema.prisma`, update the `User` model to include fields for tracking subscription status:
        * `stripeCustomerId: String? @unique`
        * `subscriptionStatus: String?` (e.g., "active", "canceled", "past_due")
        * `subscriptionId: String? @unique`
        * `plan: String? @default("free")`
        * `subscriptionEndDate: DateTime?`
    - [ ] **Sub-task 1.5 (Migration):** Run `npx prisma migrate dev --name "add_stripe_subscription_fields"` and `npx prisma generate`.

- [ ] **Task 2: Implement Checkout Session Endpoint**
    - [ ] **Sub-task 2.1:** Create new files: `src/routes/payment.routes.ts`, `src/controllers/payment.controller.ts`, and `src/services/payment.service.ts`.
    - [ ] **Sub-task 2.2:** Create the endpoint `POST /api/payments/create-checkout-session`. This route must be protected by authentication middleware.
    - [ ] **Sub-task 2.3 (Service Logic):** The service function for this endpoint must:
        1.  Find the user in the database.
        2.  If the user does not have a `stripeCustomerId`, create one using `stripe.customers.create()` and save the ID to the user's record.
        3.  Create a Stripe Checkout Session using `stripe.checkout.sessions.create()`. Pass the user's `stripeCustomerId` and the `STRIPE_PRICE_ID` from your environment variables. Also configure `success_url` and `cancel_url` to point back to your frontend.
        4.  Return the `sessionId` from the Stripe response.

- [ ] **Task 3: Implement Stripe Webhook Handler**
    - [ ] **Sub-task 3.1:** Create a new endpoint `POST /api/stripe-webhook`. **This route should not use your standard JWT `protect` middleware**, as it receives requests from Stripe's servers, not your users. It needs a different way to handle raw request bodies for signature verification.
    - [ ] **Sub-task 3.2 (Signature Verification):** The controller must securely verify the `Stripe-Signature` header from the webhook request to confirm it's genuinely from Stripe, using your `STRIPE_WEBHOOK_SECRET`.
    - [ ] **Sub-task 3.3 (Event Handling):** The service logic must handle key events from Stripe:
        * `checkout.session.completed`: When a user successfully pays for the first time. Use the data from this event to find the user (via `stripeCustomerId`) and update their `subscriptionStatus` to "active", set their `plan` to "pro", and save the `subscriptionId` and `subscriptionEndDate`.
        * `customer.subscription.updated`: To handle subscription changes, including cancellations where `cancel_at_period_end` is true.
        * `customer.subscription.deleted`: When a subscription fully ends (e.g., after a cancellation period or payment failure). Update the user's `subscriptionStatus` to "canceled" and their `plan` back to "free".
    - [ ] **Sub-task 3.4 (Response):** The webhook endpoint must return a `200 OK` status quickly to let Stripe know it has successfully received the event.

- [ ] **Task 4: Write Integration Tests**
    - [ ] **Sub-task 4.1:** Create a `payment.routes.test.ts` file.
    - [ ] **Sub-task 4.2:** Write tests for the `POST /api/payments/create-checkout-session` endpoint, mocking the `stripe` library calls.
    - [ ] **Sub-task 4.3:** Write tests for the `POST /api/stripe-webhook` endpoint. This will involve creating mock Stripe event payloads and testing that your service logic correctly updates the user's status in the database for different event types.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below. If multiple tasks are done in one go, you can summarize them together but reference the task numbers.*

**(Agent will fill this section out as work is completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**
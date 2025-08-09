# Sprint ##: Backend - Auth Enhancements (Google & Verification)

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Implementing Google Sign-In & Email Verification
**Overview:** This sprint focuses on enhancing the backend authentication system. The primary goals are to add support for "Sign in with Google" by creating an endpoint to verify Google ID tokens, and to implement a secure email verification flow for new users who register with an email and password.

---

## I. Planned Tasks & To-Do List

- [x] **Task 1: Google Sign-In Backend Logic**
    - [ ] **Sub-task 1.1 (Admin Setup):** Manually create OAuth 2.0 Client ID credentials in the Google Cloud Console for a "Web application." Add the `Client ID` to your `.env` file (`GOOGLE_CLIENT_ID`).
    - [x] **Sub-task 1.2 (Dependencies):** Install the Google Auth Library: `npm install google-auth-library`.
    - [x] **Sub-task 1.3 (Schema):** Add an optional `googleId: String? @unique` field to the `User` model in `schema.prisma`.
    - [x] **Sub-task 1.4 (API Endpoint):** Create a new route `POST /api/auth/google`.
    - [x] **Sub-task 1.5 (Service Logic):** Implement the service function for this endpoint. It must:
        1. Accept an `idToken` from the request body.
        2. Use `google-auth-library` to verify the `idToken` against your `GOOGLE_CLIENT_ID`.
        3. Extract the `email`, `name`, and `sub` (Google ID) from the verified token payload.
        4. Check if a user with that `email` already exists in your database.
        5. If the user exists, log them in by generating and returning your app's own JWT.
        6. If the user does *not* exist, create a new `User` record with their email, name, and Google ID, then generate and return your app's JWT.

- [x] **Task 2: Email Verification Backend Logic**
    - [x] **Sub-task 2.1 (Schema):**
        * Add `isVerified: Boolean @default(false)` to the `User` model.
        * Create a new model, `VerificationToken`, with fields: `id`, `token` (unique string), `expiresAt` (DateTime), and a relation to the `User` (`userId`).
    - [x] **Sub-task 2.2 (Email Service Setup):** Install an email sending library like `Nodemailer` and configure it with a transactional email service provider (e.g., set up environment variables for SendGrid, Mailgun, or Resend).
    - [ ] **Sub-task 2.3 (Registration Flow Update):** In the `POST /api/auth/register` service function:
        * After creating a new user, generate a unique, secure token.
        * Save this token and an expiration date to the `VerificationToken` table, linked to the new user.
        * Use the email service to send a verification email to the user, containing a link like `https://yourapp.com/verify-email?token={your_token}`.
    - [x] **Sub-task 2.4 (Verification Endpoint):** Create a new endpoint `POST /api/auth/verify-email`.
    - [x] Added request endpoint `POST /api/auth/verify-email/request` to send verification email.
        * The service logic will receive a `token` from the request body.
        * It must find the token in the `VerificationToken` table, check that it hasn't expired, find the associated user, update `user.isVerified` to `true`, and then delete the used token.
        * Return a success message.

- [ ] **Task 3: Testing**
    - [ ] **Sub-task 3.1:** Write integration tests for the new `POST /api/auth/google` endpoint, mocking the Google Auth Library's verification call.
    - [ ] **Sub-task 3.2:** Write integration tests for the email verification flow, including token creation and the verification endpoint.

---

## II. Agent's Implementation Summary & Notes

**Completed:**
- Added `googleId`, `isVerified`, and `VerificationToken` model to `schema.prisma`; applied migration.
- Implemented routes: `POST /api/auth/google`, `POST /api/auth/verify-email/request`, `POST /api/auth/verify-email`.
- Implemented Google token verification via `google-auth-library` and email sending via `nodemailer`.
- Installed required dependencies and wired routes.

**Next:**
- Configure env vars: `GOOGLE_CLIENT_ID`, `SMTP_*`, `EMAIL_FROM`, `APP_BASE_URL`.
- Add tests for Google auth (mock token verify) and email verification flow.

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**
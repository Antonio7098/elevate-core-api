import { Router } from 'express';
import { registerUser, loginUser, googleAuth, requestEmailVerification, verifyEmail } from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

// Register new user
router.post('/register', ...validateRegister, registerUser);

// Login user
router.post('/login', ...validateLogin, loginUser);

// Google sign-in
router.post('/google', googleAuth);

// Email verification
router.post('/verify-email/request', requestEmailVerification);
router.post('/verify-email', verifyEmail);

export const authRouter = router;
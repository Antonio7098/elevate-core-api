import { Router } from 'express';
import { register, login, googleAuth, verifyEmail } from '../../controllers/user/auth.controller';
import { validateRegister, validateLogin } from '../../middleware/validation';

const router = Router();

// Register new user
router.post('/register', ...validateRegister, register);

// Login user
router.post('/login', ...validateLogin, login);

// Google sign-in
router.post('/google', googleAuth);

// Email verification
router.post('/verify-email', verifyEmail);

export const authRouter = router;
import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

// Register new user
router.post('/register', ...validateRegister, registerUser);

// Login user
router.post('/login', ...validateLogin, loginUser);

export const authRouter = router;
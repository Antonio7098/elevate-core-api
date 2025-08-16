import { Router } from 'express';
import chatController from '../../controllers/ai/chat.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

router.post('/message', protect, chatController.handleChatMessage);

export default router;

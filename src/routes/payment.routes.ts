import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
// Lazy instantiate controller to avoid initializing Stripe during import in tests
router.post('/create-checkout-session', protect, (req, res) => {
  const controller = new PaymentController();
  return controller.createCheckoutSession(req, res);
});

export default router;



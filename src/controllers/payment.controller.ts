import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createCheckoutSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId as number | undefined;
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const session = await this.paymentService.createCheckoutSession(userId);
      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      const message = error?.message || 'Failed to create checkout session';
      const status = message.includes('not configured') ? 503 : 500;
      res.status(status).json({ message, error: message });
    }
  }
}



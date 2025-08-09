import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma';

const router = express.Router();

// Stripe requires the raw body to validate signatures
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!sig || !webhookSecret || !stripeSecret) {
    res.status(400).send('Missing Stripe configuration');
    return;
  }

  const stripe = new Stripe(stripeSecret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent((req as any).body, sig, webhookSecret);
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.customer && session.subscription) {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;

          // Retrieve subscription to get current_period_end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const endDate = (subscription as any).currentPeriodEnd
            ? new Date((subscription as any).currentPeriodEnd * 1000)
            : null;

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: 'active',
              plan: 'pro',
              subscriptionId: subscriptionId,
              subscriptionEndDate: endDate,
            },
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const subscriptionId = subscription.id;
        const endDate = (subscription as any).currentPeriodEnd
          ? new Date((subscription as any).currentPeriodEnd * 1000)
          : null;

        await prisma.user.updateMany({
          where: { subscriptionId },
          data: {
            subscriptionStatus: status,
            subscriptionEndDate: endDate,
            plan: status === 'active' ? 'pro' : 'free',
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        await prisma.user.updateMany({
          where: { subscriptionId },
          data: {
            subscriptionStatus: 'canceled',
            plan: 'free',
            subscriptionEndDate: null,
            subscriptionId: null,
          },
        });
        break;
      }
      default:
        // Ignore other events for now
        break;
    }
  } catch (error) {
    console.error('Error handling Stripe webhook event:', error);
    res.status(500).send('Internal Server Error');
    return;
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
  return;
});

export default router;



import Stripe from 'stripe';
import prisma from '../lib/prisma';

export class PaymentService {
  private stripe: Stripe | null;
  private isConfigured: boolean;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.isConfigured = !!secretKey;
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  async getOrCreateCustomer(userId: number): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const customer = await this.stripe.customers.create({
      metadata: { userId: String(userId) },
      email: user.email,
      name: user.name || undefined,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(userId: number) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const stripeCustomerId = await this.getOrCreateCustomer(userId);
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      throw new Error('STRIPE_PRICE_ID is not set');
    }

    const successUrl = process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/pay/success';
    const cancelUrl = process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/pay/cancel';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
    });

    return session;
  }
}



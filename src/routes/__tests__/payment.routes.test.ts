import request from 'supertest';
import { app } from '../../app';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test_123' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' }),
      },
    },
  }));
});

describe('POST /api/payments/create-checkout-session', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/payments/create-checkout-session')
      .send({});
    expect(res.status).toBe(401);
  });
});



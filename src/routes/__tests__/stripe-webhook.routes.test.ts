import request from 'supertest';
import { app } from '../../app';

// We won't validate full signature flow in unit test; just ensure endpoint exists and returns 400 when misconfigured

describe('POST /api/stripe-webhook', () => {
  it('returns 400 if missing Stripe config', async () => {
    const res = await request(app)
      .post('/api/stripe-webhook')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(400);
  });
});



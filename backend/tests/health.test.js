const request = require('supertest');
const app = require('../src/app');

describe('Backend Foundation Smoke Tests', () => {
  it('GET /api/health returns standardized success response shape', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('service', 'orderwise-backend');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('database');
    expect(res.headers).toHaveProperty('x-request-id');
  });

  it('GET /api/unknown-endpoint returns standardized error response shape with 404', async () => {
    const res = await request(app).get('/api/non-existent-route-for-testing');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    // Top-level aliases for AGENTS.md compatibility
    expect(res.body).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body).toHaveProperty('message');
  });
});

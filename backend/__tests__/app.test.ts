import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('ICQ Messenger API');
  });
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123456',
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          username: 'testuser',
        });

      expect(response.status).toBe(400);
    });
  });
});

// TODO: Add more tests for conversations, messages, and WebSocket events

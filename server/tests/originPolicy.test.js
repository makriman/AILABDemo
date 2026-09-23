process.env.QUIZ_STATE_SECRET = 'test-quiz-state-secret-0123456789abcd';

const request = require('supertest');
const app = require('../src/app');

describe('origin policy', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalAllowedOrigins === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
    }
  });

  test('allows requests without an Origin header', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  test('treats a default port on the Host header as same-origin', async () => {
    const response = await request(app)
      .get('/health')
      .set('Host', 'quiz.example:80')
      .set('Origin', 'http://quiz.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('allows a same-origin browser request and does not reflect it', async () => {
    const response = await request(app)
      .get('/health')
      .set('Host', 'quiz.example')
      .set('Origin', 'http://quiz.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('rejects a cross-origin browser request without CORS headers', async () => {
    const response = await request(app)
      .get('/health')
      .set('Host', 'quiz.example')
      .set('Origin', 'https://evil.example');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Origin not allowed.');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  test('ignores a wildcard allowlist', async () => {
    process.env.ALLOWED_ORIGINS = '*';

    const response = await request(app)
      .get('/health')
      .set('Host', 'quiz.example')
      .set('Origin', 'https://evil.example');

    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('reflects only an explicitly allowlisted origin and never credentials', async () => {
    process.env.ALLOWED_ORIGINS = '*, https://quiz.example/path';

    const response = await request(app)
      .options('/api/quiz/generate')
      .set('Host', 'api.example')
      .set('Origin', 'https://quiz.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('https://quiz.example');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    expect(response.headers['access-control-allow-headers']).toBe('Content-Type');
    expect(response.headers.vary).toMatch(/origin/i);
  });

  test('allows the Vite loopback origin outside production', async () => {
    process.env.NODE_ENV = 'test';

    const response = await request(app)
      .get('/health')
      .set('Host', 'localhost:3001')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
  });

  test('rejects form posts that are not JSON', async () => {
    const response = await request(app)
      .post('/api/quiz/generate')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('jobDescription=not-json');

    expect(response.status).toBe(415);
    expect(response.body.error).toBe('Content-Type must be application/json.');
  });

  test('rejects the Vite loopback origin in production unless it is allowlisted', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOWED_ORIGINS;

    const response = await request(app)
      .get('/health')
      .set('Host', 'quiz.example')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

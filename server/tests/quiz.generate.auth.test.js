process.env.QUIZ_STATE_SECRET = 'test-secret-1234567890';

jest.mock('axios');

const request = require('supertest');

const GENERATION_SECRET = 'test-generation-secret';
const JOB_DESCRIPTION =
  'This is a sufficiently long job description for validation to pass and trigger generation.';

describe('quiz generation spend gate', () => {
  let axios;
  let app;
  let generateQuizFromJobDescription;
  let ClaudeServiceError;
  const originalSecret = process.env.QUIZ_GENERATION_SECRET;
  const originalApiKey = process.env.CLAUDE_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    axios = require('axios');
    axios.post.mockReset();
    app = require('../src/app');
    ({
      generateQuizFromJobDescription,
      ClaudeServiceError,
    } = require('../src/services/claude.service'));
    process.env.CLAUDE_API_KEY = 'sk-ant-test';
    delete process.env.QUIZ_GENERATION_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.QUIZ_GENERATION_SECRET;
    } else {
      process.env.QUIZ_GENERATION_SECRET = originalSecret;
    }

    if (originalApiKey === undefined) {
      delete process.env.CLAUDE_API_KEY;
    } else {
      process.env.CLAUDE_API_KEY = originalApiKey;
    }
  });

  test('HTTP callers without a configured secret never reach Anthropic', async () => {
    const response = await request(app).post('/api/quiz/generate').send({
      jobDescription: JOB_DESCRIPTION,
    });

    expect(response.status).toBe(503);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('an empty generation secret keeps Claude disabled', async () => {
    process.env.QUIZ_GENERATION_SECRET = '';

    const response = await request(app)
      .post('/api/quiz/generate')
      .set('X-Quiz-Generation-Secret', '')
      .send({ jobDescription: JOB_DESCRIPTION });

    expect(response.status).toBe(503);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('HTTP callers with the wrong secret never reach Anthropic', async () => {
    process.env.QUIZ_GENERATION_SECRET = GENERATION_SECRET;

    const response = await request(app)
      .post('/api/quiz/generate')
      .set('X-Quiz-Generation-Secret', 'wrong-generation-secret')
      .send({ jobDescription: JOB_DESCRIPTION });

    expect(response.status).toBe(401);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('HTTP callers that omit the header never reach Anthropic', async () => {
    process.env.QUIZ_GENERATION_SECRET = GENERATION_SECRET;

    const response = await request(app).post('/api/quiz/generate').send({
      jobDescription: JOB_DESCRIPTION,
    });

    expect(response.status).toBe(401);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('a configured secret is required before Claude is called directly', async () => {
    await expect(generateQuizFromJobDescription(JOB_DESCRIPTION)).rejects.toMatchObject({
      statusCode: 503,
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('Anthropic is called only when the server secret is configured and presented', async () => {
    process.env.QUIZ_GENERATION_SECRET = GENERATION_SECRET;
    axios.post.mockRejectedValue(new Error('network down'));

    const response = await request(app)
      .post('/api/quiz/generate')
      .set('X-Quiz-Generation-Secret', GENERATION_SECRET)
      .send({ jobDescription: JOB_DESCRIPTION });

    expect(response.status).toBe(500);
    expect(axios.post).toHaveBeenCalled();
    axios.post.mock.calls.forEach((call) => {
      expect(call[0]).toBe('https://api.anthropic.com/v1/messages');
    });
  });

  test('the direct Claude path calls Anthropic only after the secret is configured', async () => {
    process.env.QUIZ_GENERATION_SECRET = GENERATION_SECRET;
    axios.post.mockRejectedValue(new Error('network down'));

    await expect(generateQuizFromJobDescription(JOB_DESCRIPTION)).rejects.toBeInstanceOf(
      ClaudeServiceError
    );

    expect(axios.post).toHaveBeenCalled();
    axios.post.mock.calls.forEach((call) => {
      expect(call[0]).toBe('https://api.anthropic.com/v1/messages');
    });
  });
});

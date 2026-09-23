jest.mock('axios', () => ({
  post: jest.fn(),
}));

const axios = require('axios');
const { generateQuizFromJobDescription, ClaudeServiceError } = require('../src/services/claude.service');

describe('claude authentication failures', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    axios.post.mockReset();
    process.env.CLAUDE_API_KEY = 'test-api-key-not-real';
    process.env.CLAUDE_MODEL = 'claude-sonnet-4-6';
    delete process.env.CLAUDE_MODELS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('stops walking model candidates after an authentication failure', async () => {
    axios.post.mockRejectedValue({
      response: { status: 401, data: { error: { type: 'authentication_error' } } },
    });

    await expect(generateQuizFromJobDescription('x'.repeat(80))).rejects.toBeInstanceOf(ClaudeServiceError);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('tries the next model when the current one is unavailable', async () => {
    axios.post
      .mockRejectedValueOnce({
        response: { status: 404, data: { error: { type: 'not_found_error' } } },
      })
      .mockRejectedValueOnce({
        response: { status: 403, data: {} },
      });

    await expect(generateQuizFromJobDescription('x'.repeat(80))).rejects.toMatchObject({
      statusCode: 500,
      code: 'AUTH_FAILED',
    });
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});

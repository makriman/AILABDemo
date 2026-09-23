const {
  assertQuizStateSecretConfigured,
  readQuizStateSecret,
} = require('../src/utils/quizStateSecret');

describe('quizStateSecret', () => {
  const originalSecret = process.env.QUIZ_STATE_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.QUIZ_STATE_SECRET;
    } else {
      process.env.QUIZ_STATE_SECRET = originalSecret;
    }
  });

  test('rejects a missing secret without inventing a value', () => {
    delete process.env.QUIZ_STATE_SECRET;

    expect(readQuizStateSecret()).toBe('');
    expect(() => assertQuizStateSecretConfigured()).toThrow(/QUIZ_STATE_SECRET/);
  });

  test('rejects a short secret without echoing it', () => {
    process.env.QUIZ_STATE_SECRET = 'short-but-not-empty';

    expect(() => assertQuizStateSecretConfigured()).toThrow(/at least 32 characters/);
    try {
      assertQuizStateSecretConfigured();
    } catch (error) {
      expect(error.message).not.toContain('short-but-not-empty');
    }
  });

  test('rejects documented placeholders', () => {
    process.env.QUIZ_STATE_SECRET = 'replace-with-a-long-random-secret';

    expect(() => assertQuizStateSecretConfigured()).toThrow(/at least 32 characters/);
  });

  test('accepts a long unique secret', () => {
    process.env.QUIZ_STATE_SECRET = 'test-quiz-state-secret-0123456789abcd';

    expect(readQuizStateSecret()).toBe('test-quiz-state-secret-0123456789abcd');
    expect(() => assertQuizStateSecretConfigured()).not.toThrow();
  });
});

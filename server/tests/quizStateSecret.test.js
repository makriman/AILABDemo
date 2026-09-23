const {
  MIN_QUIZ_STATE_SECRET_LENGTH,
  assertQuizStateSecretConfigured,
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

  test('rejects missing, short, and placeholder secrets without echoing them', () => {
    delete process.env.QUIZ_STATE_SECRET;
    expect(() => assertQuizStateSecretConfigured()).toThrow(
      'Missing required environment variables: QUIZ_STATE_SECRET'
    );

    process.env.QUIZ_STATE_SECRET = '   ';
    expect(() => assertQuizStateSecretConfigured()).toThrow(
      'Missing required environment variables: QUIZ_STATE_SECRET'
    );

    const shortSecret = 'x'.repeat(MIN_QUIZ_STATE_SECRET_LENGTH - 1);
    process.env.QUIZ_STATE_SECRET = `  ${shortSecret}  `;
    expect(() => assertQuizStateSecretConfigured()).toThrow(
      `QUIZ_STATE_SECRET must be at least ${MIN_QUIZ_STATE_SECRET_LENGTH} characters.`
    );

    process.env.QUIZ_STATE_SECRET = 'Replace-With-A-Long-Random-Secret';
    try {
      assertQuizStateSecretConfigured();
      throw new Error('Expected placeholder secret to be rejected.');
    } catch (error) {
      expect(error.message).toMatch(/placeholder/i);
      expect(error.message).not.toContain('Replace-With-A-Long-Random-Secret');
    }
  });

  test('accepts a unique secret of the minimum length', () => {
    process.env.QUIZ_STATE_SECRET = 'a'.repeat(MIN_QUIZ_STATE_SECRET_LENGTH);
    expect(() => assertQuizStateSecretConfigured()).not.toThrow();

    process.env.QUIZ_STATE_SECRET = ` ${'test-only-value'.padEnd(44, 'x')} `;
    expect(() => assertQuizStateSecretConfigured()).not.toThrow();
  });
});

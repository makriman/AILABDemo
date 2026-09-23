const {
  createAttemptToken,
  decryptAttemptToken,
  QuizSessionError,
} = require('../src/services/quizSession.service');

describe('quizSession.service', () => {
  beforeEach(() => {
    process.env.QUIZ_STATE_SECRET = 'test-only-quiz-state-secret-0123456789';
  });

  test('encrypts and decrypts a payload', () => {
    const payload = {
      jobTitle: 'Product Manager',
      questions: [{ questionId: 'q1', correctAnswer: 'A', options: [] }],
      learningSummary: 'Keep learning',
    };

    const { attemptToken, expiresAt } = createAttemptToken(payload);
    const decrypted = decryptAttemptToken(attemptToken);

    expect(typeof attemptToken).toBe('string');
    expect(attemptToken).toMatch(/^v1\./);
    expect(new Date(expiresAt).toISOString()).toBe(expiresAt);

    expect(decrypted.jobTitle).toBe('Product Manager');
    expect(decrypted.questions).toHaveLength(1);
    expect(decrypted.learningSummary).toBe('Keep learning');
    expect(typeof decrypted.exp).toBe('number');
  });

  test('rejects tampered token', () => {
    const { attemptToken } = createAttemptToken({
      jobTitle: 'Engineer',
      questions: [],
      learningSummary: 'Summary',
    });

    const tamperedToken = `${attemptToken}corrupted`;

    expect(() => decryptAttemptToken(tamperedToken)).toThrow(QuizSessionError);
    expect(() => decryptAttemptToken(tamperedToken)).toThrow('Invalid token.');
  });

  test('rejects a short or placeholder QUIZ_STATE_SECRET', () => {
    process.env.QUIZ_STATE_SECRET = 'short-secret';

    expect(() =>
      createAttemptToken({
        jobTitle: 'Engineer',
        questions: [],
        learningSummary: 'Summary',
      })
    ).toThrow(QuizSessionError);

    try {
      createAttemptToken({
        jobTitle: 'Engineer',
        questions: [],
        learningSummary: 'Summary',
      });
    } catch (error) {
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('QUIZ_STATE_SECRET is not configured.');
      expect(error.message).not.toContain('short-secret');
    }

    process.env.QUIZ_STATE_SECRET = '  replace-with-a-long-random-secret  ';

    expect(() =>
      createAttemptToken({
        jobTitle: 'Engineer',
        questions: [],
        learningSummary: 'Summary',
      })
    ).toThrow('QUIZ_STATE_SECRET is not configured.');
  });

  test('rejects expired token', () => {
    const originalNow = Date.now;
    const now = Date.now();

    Date.now = jest.fn(() => now);

    const { attemptToken } = createAttemptToken({
      jobTitle: 'Engineer',
      questions: [],
      learningSummary: 'Summary',
    });

    Date.now = jest.fn(() => now + 31 * 60 * 1000);

    try {
      decryptAttemptToken(attemptToken);
      throw new Error('Expected token to be expired.');
    } catch (error) {
      expect(error).toBeInstanceOf(QuizSessionError);
      expect(error.statusCode).toBe(410);
    } finally {
      Date.now = originalNow;
    }
  });
});

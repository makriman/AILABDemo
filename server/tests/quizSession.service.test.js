const {
  createAttemptToken,
  decryptAttemptToken,
  QuizSessionError,
} = require('../src/services/quizSession.service');

describe('quizSession.service', () => {
  beforeEach(() => {
    process.env.QUIZ_STATE_SECRET = 'test-quiz-state-secret-0123456789abcd';
  });

  test('encrypts and decrypts a payload', () => {
    const payload = {
      jobTitle: 'Product Manager',
      questions: [{ questionId: 'q1', correctAnswer: 'A', options: [] }],
      learningSummary: 'Keep learning',
      aud: 'other',
      iss: 'other',
      v: 99,
      exp: 1,
    };

    const { attemptToken, expiresAt } = createAttemptToken(payload);
    const decrypted = decryptAttemptToken(attemptToken);

    expect(typeof attemptToken).toBe('string');
    expect(attemptToken).toMatch(/^v1\./);
    expect(new Date(expiresAt).toISOString()).toBe(expiresAt);

    expect(decrypted.jobTitle).toBe('Product Manager');
    expect(decrypted.questions).toHaveLength(1);
    expect(decrypted.learningSummary).toBe('Keep learning');
    expect(decrypted.iss).toBe('jd-quiz');
    expect(decrypted.aud).toBe('quiz-submit');
    expect(typeof decrypted.exp).toBe('number');
  });

  test('rejects tampered token', () => {
    const { attemptToken } = createAttemptToken({
      jobTitle: 'Engineer',
      questions: [{ questionId: 'q1', correctAnswer: 'A' }],
      learningSummary: 'Summary',
    });

    const tamperedToken = `${attemptToken}corrupted`;

    expect(() => decryptAttemptToken(tamperedToken)).toThrow(QuizSessionError);
    expect(() => decryptAttemptToken(tamperedToken)).toThrow('Invalid token.');
  });

  test('rejects expired token', () => {
    const originalNow = Date.now;
    const now = Date.now();

    Date.now = jest.fn(() => now);

    const { attemptToken } = createAttemptToken({
      jobTitle: 'Engineer',
      questions: [{ questionId: 'q1', correctAnswer: 'A' }],
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

  test('rejects a token whose lifetime is longer than the quiz window', () => {
    const originalNow = Date.now;
    const now = Date.now();
    Date.now = jest.fn(() => now + 2 * 60 * 60 * 1000);

    let attemptToken;
    try {
      ({ attemptToken } = createAttemptToken({
        jobTitle: 'Engineer',
        questions: [{ questionId: 'q1', correctAnswer: 'B' }],
        learningSummary: 'Summary',
      }));
    } finally {
      Date.now = originalNow;
    }

    expect(() => decryptAttemptToken(attemptToken)).toThrow('Invalid token.');
  });

  test('rejects a payload that is not a quiz attempt', () => {
    expect(() =>
      createAttemptToken({
        jobTitle: 'Engineer',
        questions: [{ questionId: 'q1' }],
        learningSummary: 'Summary',
      })
    ).toThrow('Invalid token.');
  });

  test('does not echo a short secret when token crypto is refused', () => {
    process.env.QUIZ_STATE_SECRET = 'too-short';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      createAttemptToken({
        questions: [{ questionId: 'q1', correctAnswer: 'A' }],
      });
      throw new Error('Expected token creation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(QuizSessionError);
      expect(error.statusCode).toBe(500);
      expect(error.message).not.toContain('too-short');
      expect(error.message).not.toContain('QUIZ_STATE_SECRET');
      const logged = errorSpy.mock.calls.map((call) => call.join(' ')).join('\n');
      expect(logged).not.toContain('too-short');
    } finally {
      errorSpy.mockRestore();
    }
  });
});

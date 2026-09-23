process.env.QUIZ_STATE_SECRET = 'test-quiz-state-secret-0123456789abcd';

const request = require('supertest');

jest.mock('../src/services/quiz.service', () => ({
  generateQuiz: jest.fn(),
  submitQuiz: jest.fn(),
}));

const quizService = require('../src/services/quiz.service');
const app = require('../src/app');

describe('API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('POST /api/quiz/generate returns quiz + token', async () => {
    quizService.generateQuiz.mockResolvedValue({
      quiz: {
        jobTitle: 'Engineer',
        questions: [
          {
            questionId: 'q1',
            questionText: 'Q1',
            options: [
              { label: 'A', text: 'A' },
              { label: 'B', text: 'B' },
              { label: 'C', text: 'C' },
              { label: 'D', text: 'D' },
            ],
          },
        ],
      },
      attemptToken: 'v1.token.parts',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });

    const response = await request(app)
      .post('/api/quiz/generate')
      .send({
        jobDescription:
          'This is a sufficiently long job description for validation to pass and trigger generation.',
      });

    expect(response.status).toBe(200);
    expect(response.body.quiz.jobTitle).toBe('Engineer');
    expect(response.body.attemptToken).toBe('v1.token.parts');
  });

  test('POST /api/quiz/generate with short JD returns 400', async () => {
    const response = await request(app)
      .post('/api/quiz/generate')
      .send({ jobDescription: 'too short' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/at least 50 characters/i);
  });

  test('POST /api/quiz/submit returns scored results', async () => {
    quizService.submitQuiz.mockResolvedValue({
      jobTitle: 'Engineer',
      score: 3,
      totalQuestions: 5,
      results: [],
      learningSummary: 'Summary',
    });

    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        attemptToken: 'v1.token.parts',
        answers: [
          { questionId: 'q1', selectedAnswer: 'A' },
          { questionId: 'q2', selectedAnswer: 'B' },
          { questionId: 'q3', selectedAnswer: 'C' },
          { questionId: 'q4', selectedAnswer: 'D' },
          { questionId: 'q5', selectedAnswer: 'A' },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.score).toBe(3);
  });

  test('POST /api/quiz/submit returns 410 for expired token', async () => {
    const error = new Error('This temporary quiz has expired. Generate a new one.');
    error.statusCode = 410;
    quizService.submitQuiz.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        attemptToken: 'v1.token.parts',
        answers: [
          { questionId: 'q1', selectedAnswer: 'A' },
          { questionId: 'q2', selectedAnswer: 'B' },
          { questionId: 'q3', selectedAnswer: 'C' },
          { questionId: 'q4', selectedAnswer: 'D' },
          { questionId: 'q5', selectedAnswer: 'A' },
        ],
      });

    expect(response.status).toBe(410);
  });

  test('POST /api/quiz/submit returns 400 for invalid token', async () => {
    const error = new Error('Invalid token.');
    error.statusCode = 400;
    quizService.submitQuiz.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        attemptToken: 'bad-token',
        answers: [
          { questionId: 'q1', selectedAnswer: 'A' },
          { questionId: 'q2', selectedAnswer: 'B' },
          { questionId: 'q3', selectedAnswer: 'C' },
          { questionId: 'q4', selectedAnswer: 'D' },
          { questionId: 'q5', selectedAnswer: 'A' },
        ],
      });

    expect(response.status).toBe(400);
  });

  test('POST /api/quiz/submit hides server error details', async () => {
    const error = new Error(
      'QUIZ_STATE_SECRET test-quiz-state-secret-0123456789abcd could not encrypt'
    );
    error.statusCode = 500;
    quizService.submitQuiz.mockRejectedValue(error);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app)
      .post('/api/quiz/submit')
      .send({
        attemptToken: 'v1.token.parts',
        answers: [
          { questionId: 'q1', selectedAnswer: 'A' },
          { questionId: 'q2', selectedAnswer: 'B' },
          { questionId: 'q3', selectedAnswer: 'C' },
          { questionId: 'q4', selectedAnswer: 'D' },
          { questionId: 'q5', selectedAnswer: 'A' },
        ],
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error.' });
    expect(JSON.stringify(response.body)).not.toContain('QUIZ_STATE_SECRET');
    expect(JSON.stringify(response.body)).not.toContain('test-quiz-state-secret-0123456789abcd');

    const logged = errorSpy.mock.calls.map((call) => JSON.stringify(call)).join('\n');
    expect(logged).not.toContain('test-quiz-state-secret-0123456789abcd');
    errorSpy.mockRestore();
  });
});

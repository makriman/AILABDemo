const { validateSubmissionAnswers, scoreQuiz, normalizeJobDescription } = require('../src/services/quiz.service');

describe('quiz.service', () => {
  const questions = [
    {
      questionId: 'q1',
      questionText: 'Q1',
      options: [
        { label: 'A', text: 'A1' },
        { label: 'B', text: 'B1' },
        { label: 'C', text: 'C1' },
        { label: 'D', text: 'D1' },
      ],
      correctAnswer: 'A',
      explanation: 'A is correct',
      wrongExplanations: { B: 'B wrong', C: 'C wrong', D: 'D wrong' },
    },
    {
      questionId: 'q2',
      questionText: 'Q2',
      options: [
        { label: 'A', text: 'A2' },
        { label: 'B', text: 'B2' },
        { label: 'C', text: 'C2' },
        { label: 'D', text: 'D2' },
      ],
      correctAnswer: 'C',
      explanation: 'C is correct',
      wrongExplanations: { A: 'A wrong', B: 'B wrong', D: 'D wrong' },
    },
    {
      questionId: 'q3',
      questionText: 'Q3',
      options: [
        { label: 'A', text: 'A3' },
        { label: 'B', text: 'B3' },
        { label: 'C', text: 'C3' },
        { label: 'D', text: 'D3' },
      ],
      correctAnswer: 'B',
      explanation: 'B is correct',
      wrongExplanations: { A: 'A wrong', C: 'C wrong', D: 'D wrong' },
    },
    {
      questionId: 'q4',
      questionText: 'Q4',
      options: [
        { label: 'A', text: 'A4' },
        { label: 'B', text: 'B4' },
        { label: 'C', text: 'C4' },
        { label: 'D', text: 'D4' },
      ],
      correctAnswer: 'D',
      explanation: 'D is correct',
      wrongExplanations: { A: 'A wrong', B: 'B wrong', C: 'C wrong' },
    },
    {
      questionId: 'q5',
      questionText: 'Q5',
      options: [
        { label: 'A', text: 'A5' },
        { label: 'B', text: 'B5' },
        { label: 'C', text: 'C5' },
        { label: 'D', text: 'D5' },
      ],
      correctAnswer: 'A',
      explanation: 'A is correct',
      wrongExplanations: { B: 'B wrong', C: 'C wrong', D: 'D wrong' },
    },
  ];

  test('normalizeJobDescription validates minimum length', () => {
    expect(() => normalizeJobDescription('too short')).toThrow(
      'Job description must be at least 50 characters long.'
    );
  });

  test('validateSubmissionAnswers builds answer map', () => {
    const answers = [
      { questionId: 'q1', selectedAnswer: 'A' },
      { questionId: 'q2', selectedAnswer: 'B' },
      { questionId: 'q3', selectedAnswer: 'B' },
      { questionId: 'q4', selectedAnswer: 'D' },
      { questionId: 'q5', selectedAnswer: 'C' },
    ];

    const answerMap = validateSubmissionAnswers(questions, answers);

    expect(answerMap.get('q1')).toBe('A');
    expect(answerMap.size).toBe(5);
  });

  test('scoreQuiz returns correct score and explanations', () => {
    const answerMap = new Map([
      ['q1', 'A'],
      ['q2', 'B'],
      ['q3', 'B'],
      ['q4', 'D'],
      ['q5', 'C'],
    ]);

    const scored = scoreQuiz(
      {
        jobTitle: 'Engineer',
        questions,
        learningSummary: 'Summary',
      },
      answerMap
    );

    expect(scored.score).toBe(3);
    expect(scored.totalQuestions).toBe(5);
    expect(scored.results).toHaveLength(5);
    expect(scored.results[1].isCorrect).toBe(false);
    expect(scored.results[1].wrongExplanation).toBe('B wrong');
  });
});

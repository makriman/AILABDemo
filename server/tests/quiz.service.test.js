const { scoreQuiz, validateSubmissionAnswers } = require('../src/services/quiz.service');

describe('quiz.service', () => {
  const quiz = {
    questions: [
      {
        questionId: 'q1',
        questionText: 'Q1',
        correctAnswer: 'A',
        explanation: 'A is correct',
        wrongExplanations: { B: 'B wrong', C: 'C wrong', D: 'D wrong' },
      },
      {
        questionId: 'q2',
        questionText: 'Q2',
        correctAnswer: 'C',
        explanation: 'C is correct',
        wrongExplanations: { A: 'A wrong', B: 'B wrong', D: 'D wrong' },
      },
      {
        questionId: 'q3',
        questionText: 'Q3',
        correctAnswer: 'B',
        explanation: 'B is correct',
        wrongExplanations: { A: 'A wrong', C: 'C wrong', D: 'D wrong' },
      },
      {
        questionId: 'q4',
        questionText: 'Q4',
        correctAnswer: 'D',
        explanation: 'D is correct',
        wrongExplanations: { A: 'A wrong', B: 'B wrong', C: 'C wrong' },
      },
      {
        questionId: 'q5',
        questionText: 'Q5',
        correctAnswer: 'A',
        explanation: 'A is correct',
        wrongExplanations: { B: 'B wrong', C: 'C wrong', D: 'D wrong' },
      },
    ],
  };

  test('validateSubmissionAnswers builds answer map', () => {
    const answers = [
      { questionId: 'q1', selectedAnswer: 'A' },
      { questionId: 'q2', selectedAnswer: 'B' },
      { questionId: 'q3', selectedAnswer: 'B' },
      { questionId: 'q4', selectedAnswer: 'D' },
      { questionId: 'q5', selectedAnswer: 'C' },
    ];

    const answerMap = validateSubmissionAnswers(quiz, answers);

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

    const scored = scoreQuiz(quiz, answerMap);

    expect(scored.score).toBe(3);
    expect(scored.results).toHaveLength(5);
    expect(scored.results[1].isCorrect).toBe(false);
    expect(scored.results[1].wrongExplanation).toBe('B wrong');
  });
});

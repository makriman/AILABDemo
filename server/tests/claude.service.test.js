const {
  parseJsonFromText,
  validateAndNormalizeQuizPayload,
} = require('../src/services/claude.service');

describe('claude.service helpers', () => {
  const validPayload = {
    jobTitle: 'Software Engineer',
    questions: [
      {
        questionId: 'q1',
        questionText: 'Question 1?',
        options: [
          { label: 'A', text: 'A1' },
          { label: 'B', text: 'B1' },
          { label: 'C', text: 'C1' },
          { label: 'D', text: 'D1' },
        ],
        correctAnswer: 'A',
        explanation: 'Because A1.',
        wrongExplanations: { B: 'no', C: 'no', D: 'no' },
      },
      {
        questionId: 'q2',
        questionText: 'Question 2?',
        options: [
          { label: 'A', text: 'A2' },
          { label: 'B', text: 'B2' },
          { label: 'C', text: 'C2' },
          { label: 'D', text: 'D2' },
        ],
        correctAnswer: 'B',
        explanation: 'Because B2.',
        wrongExplanations: { A: 'no', C: 'no', D: 'no' },
      },
      {
        questionId: 'q3',
        questionText: 'Question 3?',
        options: [
          { label: 'A', text: 'A3' },
          { label: 'B', text: 'B3' },
          { label: 'C', text: 'C3' },
          { label: 'D', text: 'D3' },
        ],
        correctAnswer: 'C',
        explanation: 'Because C3.',
        wrongExplanations: { A: 'no', B: 'no', D: 'no' },
      },
      {
        questionId: 'q4',
        questionText: 'Question 4?',
        options: [
          { label: 'A', text: 'A4' },
          { label: 'B', text: 'B4' },
          { label: 'C', text: 'C4' },
          { label: 'D', text: 'D4' },
        ],
        correctAnswer: 'D',
        explanation: 'Because D4.',
        wrongExplanations: { A: 'no', B: 'no', C: 'no' },
      },
      {
        questionId: 'q5',
        questionText: 'Question 5?',
        options: [
          { label: 'A', text: 'A5' },
          { label: 'B', text: 'B5' },
          { label: 'C', text: 'C5' },
          { label: 'D', text: 'D5' },
        ],
        correctAnswer: 'A',
        explanation: 'Because A5.',
        wrongExplanations: { B: 'no', C: 'no', D: 'no' },
      },
    ],
    learningSummary: 'Key takeaways.',
  };

  test('parseJsonFromText parses direct JSON', () => {
    const parsed = parseJsonFromText(JSON.stringify(validPayload));
    expect(parsed.jobTitle).toBe('Software Engineer');
  });

  test('parseJsonFromText extracts JSON wrapped in text', () => {
    const wrapped = `Here:\n\n\
${JSON.stringify(validPayload)}\nDone.`;
    const parsed = parseJsonFromText(wrapped);
    expect(parsed.questions).toHaveLength(5);
  });

  test('validateAndNormalizeQuizPayload rejects wrong question count', () => {
    const badPayload = { ...validPayload, questions: validPayload.questions.slice(0, 4) };
    expect(() => validateAndNormalizeQuizPayload(badPayload)).toThrow(
      'Claude must return exactly 5 questions.'
    );
  });

  test('validateAndNormalizeQuizPayload returns normalized data', () => {
    const normalized = validateAndNormalizeQuizPayload(validPayload);
    expect(normalized.questions[0].questionId).toBe('q1');
    expect(normalized.questions[2].correctAnswer).toBe('C');
  });

  test('validateAndNormalizeQuizPayload allows missing jobTitle for service fallback', () => {
    const withoutTitle = { ...validPayload };
    delete withoutTitle.jobTitle;

    const normalized = validateAndNormalizeQuizPayload(withoutTitle);
    expect(normalized.jobTitle).toBe('');
    expect(normalized.questions).toHaveLength(5);
  });
});

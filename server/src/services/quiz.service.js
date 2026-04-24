const { sanitizeString } = require('../utils/sanitizers');
const { generateQuizFromJobDescription, ClaudeServiceError } = require('./claude.service');
const {
  createAttemptToken,
  decryptAttemptToken,
  QuizSessionError,
} = require('./quizSession.service');

const JD_MIN_LENGTH = 50;
const JD_MAX_LENGTH = 15000;
const VALID_OPTIONS = new Set(['A', 'B', 'C', 'D']);

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeJobDescription(input) {
  const clean = sanitizeString(input, JD_MAX_LENGTH);

  if (!clean || clean.trim().length === 0) {
    throw createHttpError('Please paste a job description before submitting.', 400);
  }

  if (clean.length < JD_MIN_LENGTH) {
    throw createHttpError(`Job description must be at least ${JD_MIN_LENGTH} characters long.`, 400);
  }

  return clean.slice(0, JD_MAX_LENGTH);
}

function inferJobTitleFromText(jobDescription) {
  const firstNonEmptyLine = jobDescription
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstNonEmptyLine) {
    return 'Untitled Role';
  }

  return firstNonEmptyLine.slice(0, 120);
}

function toPublicQuiz(generatedQuiz, fallbackJobTitle) {
  const jobTitle = generatedQuiz.jobTitle || fallbackJobTitle;

  return {
    jobTitle,
    questions: generatedQuiz.questions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      options: question.options,
    })),
  };
}

function validateSubmissionAnswers(questions, answers) {
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw createHttpError('All questions must be answered before submitting.', 400);
  }

  const answerMap = new Map();

  for (const answer of answers) {
    const questionId = sanitizeString(answer?.questionId || '', 20);
    const selectedAnswer = sanitizeString(answer?.selectedAnswer || '', 1).toUpperCase();

    if (!questionId || !VALID_OPTIONS.has(selectedAnswer)) {
      throw createHttpError('Missing answers, wrong number of answers, or invalid format.', 400);
    }

    if (answerMap.has(questionId)) {
      throw createHttpError('Each question must be answered once.', 400);
    }

    answerMap.set(questionId, selectedAnswer);
  }

  for (const question of questions) {
    if (!answerMap.has(question.questionId)) {
      throw createHttpError('All questions must be answered before submitting.', 400);
    }
  }

  return answerMap;
}

function scoreQuiz(quizPayload, answerMap) {
  const results = quizPayload.questions.map((question) => {
    const selectedAnswer = answerMap.get(question.questionId);
    const isCorrect = selectedAnswer === question.correctAnswer;

    return {
      questionId: question.questionId,
      questionText: question.questionText,
      options: question.options,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
      wrongExplanation: isCorrect ? null : question.wrongExplanations?.[selectedAnswer] || null,
    };
  });

  const score = results.filter((result) => result.isCorrect).length;

  return {
    jobTitle: quizPayload.jobTitle,
    score,
    totalQuestions: quizPayload.questions.length,
    results,
    learningSummary: quizPayload.learningSummary,
  };
}

async function generateQuiz(jobDescriptionInput) {
  const jobDescription = normalizeJobDescription(jobDescriptionInput);

  let generatedQuiz;
  try {
    generatedQuiz = await generateQuizFromJobDescription(jobDescription);
  } catch (error) {
    if (error instanceof ClaudeServiceError && error.statusCode === 429) {
      throw createHttpError('Please wait and try again shortly.', 429);
    }

    throw createHttpError('Failed to generate quiz. Please try again.', 500);
  }

  const fallbackJobTitle = inferJobTitleFromText(jobDescription);
  const quiz = toPublicQuiz(generatedQuiz, fallbackJobTitle);

  const { attemptToken, expiresAt } = createAttemptToken({
    jobTitle: quiz.jobTitle,
    questions: generatedQuiz.questions,
    learningSummary: generatedQuiz.learningSummary,
  });

  return {
    quiz,
    attemptToken,
    expiresAt,
  };
}

async function submitQuiz(attemptToken, answers) {
  let payload;
  try {
    payload = decryptAttemptToken(attemptToken);
  } catch (error) {
    if (error instanceof QuizSessionError) {
      throw createHttpError(error.message, error.statusCode);
    }

    throw createHttpError('Invalid token.', 400);
  }

  const answerMap = validateSubmissionAnswers(payload.questions, answers);
  return scoreQuiz(payload, answerMap);
}

module.exports = {
  generateQuiz,
  submitQuiz,
  validateSubmissionAnswers,
  scoreQuiz,
  normalizeJobDescription,
};

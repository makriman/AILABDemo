const quizModel = require('../models/quiz.model');
const { sanitizeString } = require('../utils/sanitizers');
const {
  generateQuizFromJobDescription,
  ClaudeServiceError,
} = require('./claude.service');

const JD_MIN_LENGTH = 50;
const JD_MAX_LENGTH = 15000;

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
    throw createHttpError('Job description must be at least 50 characters long.', 400);
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

function mapQuizForCreationResponse(quiz) {
  return {
    quizId: quiz._id,
    jobTitle: quiz.jobTitle,
    questions: quiz.questions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      options: question.options,
    })),
  };
}

function mapQuizForFetchResponse(quiz, result) {
  const base = {
    quizId: quiz._id,
    jobTitle: quiz.jobTitle,
    jobDescription: quiz.jobDescription,
    createdAt: quiz.createdAt,
  };

  if (!result) {
    return {
      ...base,
      questions: quiz.questions.map((question) => ({
        questionId: question.questionId,
        questionText: question.questionText,
        options: question.options,
      })),
      result: null,
    };
  }

  return {
    ...base,
    questions: quiz.questions,
    learningSummary: quiz.learningSummary,
    result: {
      answers: result.answers,
      score: result.score,
      completedAt: result.completedAt,
    },
  };
}

function validateSubmissionAnswers(quiz, answers) {
  if (!Array.isArray(answers) || answers.length !== 5) {
    throw createHttpError('Missing answers, wrong number of answers, or invalid format.', 400);
  }

  const answerMap = new Map();

  for (const answer of answers) {
    const questionId = sanitizeString(answer.questionId, 20);
    const selectedAnswer = sanitizeString(answer.selectedAnswer, 1).toUpperCase();

    if (!questionId || !['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      throw createHttpError('Missing answers, wrong number of answers, or invalid format.', 400);
    }

    if (answerMap.has(questionId)) {
      throw createHttpError('Each question must be answered once.', 400);
    }

    answerMap.set(questionId, selectedAnswer);
  }

  for (const question of quiz.questions) {
    if (!answerMap.has(question.questionId)) {
      throw createHttpError('All 5 questions must be answered before submitting.', 400);
    }
  }

  return answerMap;
}

function scoreQuiz(quiz, answerMap) {
  const results = quiz.questions.map((question) => {
    const selectedAnswer = answerMap.get(question.questionId);
    const isCorrect = selectedAnswer === question.correctAnswer;

    return {
      questionId: question.questionId,
      questionText: question.questionText,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
      wrongExplanation: isCorrect ? null : question.wrongExplanations[selectedAnswer] || null,
    };
  });

  const score = results.filter((result) => result.isCorrect).length;

  return { score, results };
}

function buildStoredAnswers(results) {
  return results.map((result) => ({
    questionId: result.questionId,
    selectedAnswer: result.selectedAnswer,
    isCorrect: result.isCorrect,
  }));
}

async function createQuizForUser(userId, jobDescriptionInput) {
  const jobDescription = normalizeJobDescription(jobDescriptionInput);
  const createdAt = new Date().toISOString();

  let generatedQuiz;
  try {
    generatedQuiz = await generateQuizFromJobDescription(jobDescription);
  } catch (error) {
    if (error instanceof ClaudeServiceError && error.statusCode === 429) {
      throw createHttpError('Please wait and try again shortly.', 429);
    }

    throw createHttpError('Failed to generate quiz. Please try again.', 500);
  }

  const jobTitle = generatedQuiz.jobTitle || inferJobTitleFromText(jobDescription);

  const quiz = await quizModel.createQuiz({
    userId,
    jobDescription,
    jobTitle,
    questions: generatedQuiz.questions,
    learningSummary: generatedQuiz.learningSummary,
    createdAt,
  });

  return mapQuizForCreationResponse(quiz);
}

async function listQuizzesForUser(userId) {
  const [quizzes, results] = await Promise.all([
    quizModel.findQuizzesByUserId(userId),
    quizModel.findResultsByUserId(userId),
  ]);

  const scoreByQuizId = new Map(results.map((result) => [result.quizId, result.score]));

  return quizzes.map((quiz) => ({
    quizId: quiz._id,
    jobTitle: quiz.jobTitle,
    score: scoreByQuizId.has(quiz._id) ? scoreByQuizId.get(quiz._id) : null,
    createdAt: quiz.createdAt,
  }));
}

async function getQuizByIdForUser(userId, quizId) {
  const quiz = await quizModel.findQuizById(quizId);

  if (!quiz) {
    throw createHttpError('Quiz not found.', 404);
  }

  if (quiz.userId !== userId) {
    throw createHttpError('Forbidden.', 403);
  }

  const result = await quizModel.findResultByQuizId(quizId);
  return mapQuizForFetchResponse(quiz, result);
}

async function submitQuizForUser(userId, quizId, answers) {
  const quiz = await quizModel.findQuizById(quizId);

  if (!quiz) {
    throw createHttpError('Quiz not found.', 404);
  }

  if (quiz.userId !== userId) {
    throw createHttpError('Forbidden.', 403);
  }

  const existingResult = await quizModel.findResultByQuizId(quizId);
  if (existingResult) {
    throw createHttpError('Quiz already submitted.', 409);
  }

  const answerMap = validateSubmissionAnswers(quiz, answers);
  const { score, results } = scoreQuiz(quiz, answerMap);

  const completedAt = new Date().toISOString();
  await quizModel.createResult({
    quizId,
    userId,
    answers: buildStoredAnswers(results),
    score,
    completedAt,
  });

  return {
    score,
    results,
    learningSummary: quiz.learningSummary,
  };
}

module.exports = {
  createQuizForUser,
  listQuizzesForUser,
  getQuizByIdForUser,
  submitQuizForUser,
  scoreQuiz,
  validateSubmissionAnswers,
};

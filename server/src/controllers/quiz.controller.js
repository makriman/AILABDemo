const quizService = require('../services/quiz.service');

function handleError(res, error) {
  const status = error.statusCode || 500;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('Quiz controller error:', {
      message: error.message,
      stack: error.stack,
    });
  }

  return res.status(status).json({
    error: error.message || 'Something went wrong.',
  });
}

async function createQuiz(req, res) {
  try {
    const quiz = await quizService.createQuizForUser(req.user.userId, req.body.jobDescription);
    return res.status(201).json(quiz);
  } catch (error) {
    return handleError(res, error);
  }
}

async function listQuizzes(req, res) {
  try {
    const quizzes = await quizService.listQuizzesForUser(req.user.userId);
    return res.status(200).json({ quizzes });
  } catch (error) {
    return handleError(res, error);
  }
}

async function getQuizById(req, res) {
  try {
    const quiz = await quizService.getQuizByIdForUser(req.user.userId, req.params.quizId);
    return res.status(200).json(quiz);
  } catch (error) {
    return handleError(res, error);
  }
}

async function submitQuiz(req, res) {
  try {
    const result = await quizService.submitQuizForUser(
      req.user.userId,
      req.params.quizId,
      req.body.answers
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  createQuiz,
  listQuizzes,
  getQuizById,
  submitQuiz,
};

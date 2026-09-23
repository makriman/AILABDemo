const quizService = require('../services/quiz.service');
const { redactSecrets } = require('../utils/redactSecrets');

function handleError(res, error) {
  const status = error.statusCode || 500;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('Quiz controller error:', {
      message: redactSecrets(error.message),
      status,
    });

    return res.status(500).json({
      error: 'Internal server error.',
    });
  }

  return res.status(status).json({
    error: error.message || 'Something went wrong.',
  });
}

async function generateQuiz(req, res) {
  try {
    const response = await quizService.generateQuiz(req.body.jobDescription);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

async function submitQuiz(req, res) {
  try {
    const response = await quizService.submitQuiz(req.body.attemptToken, req.body.answers);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  generateQuiz,
  submitQuiz,
};

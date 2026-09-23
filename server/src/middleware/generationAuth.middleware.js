const { assertGenerationAuthorized } = require('../utils/generationAuth');

function requireQuizGenerationAuth(req, res, next) {
  try {
    assertGenerationAuthorized(req.get('x-quiz-generation-secret'));
  } catch (error) {
    const status = error.statusCode || 401;

    if (status === 503) {
      // eslint-disable-next-line no-console
      console.error('Quiz generation rejected: QUIZ_GENERATION_SECRET is not configured.');
    }

    return res.status(status).json({
      error: status === 503 ? 'Quiz generation is disabled.' : 'Unauthorized.',
    });
  }

  return next();
}

module.exports = requireQuizGenerationAuth;

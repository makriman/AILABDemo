const express = require('express');
const quizController = require('../controllers/quiz.controller');
const validate = require('../middleware/validate.middleware');
const { generateQuizSchema, submitQuizSchema } = require('../utils/validators');
const {
  quizGenerationLimiter,
  quizSubmissionLimiter,
} = require('../middleware/rateLimit.middleware');
const requireQuizGenerationAuth = require('../middleware/generationAuth.middleware');

const router = express.Router();

router.post(
  '/generate',
  requireQuizGenerationAuth,
  quizGenerationLimiter,
  validate(generateQuizSchema),
  quizController.generateQuiz
);
router.post('/submit', quizSubmissionLimiter, validate(submitQuizSchema), quizController.submitQuiz);

module.exports = router;

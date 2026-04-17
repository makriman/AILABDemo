const express = require('express');
const quizController = require('../controllers/quiz.controller');
const validate = require('../middleware/validate.middleware');
const { createQuizSchema, submitQuizSchema } = require('../utils/validators');
const { quizCreationLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/', quizCreationLimiter, validate(createQuizSchema), quizController.createQuiz);
router.get('/', quizController.listQuizzes);
router.get('/:quizId', quizController.getQuizById);
router.post('/:quizId/submit', validate(submitQuizSchema), quizController.submitQuiz);

module.exports = router;

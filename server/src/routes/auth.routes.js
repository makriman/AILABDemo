const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  signupSchema,
  loginSchema,
  resetPasswordQuestionSchema,
  resetPasswordVerifySchema,
} = require('../utils/validators');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.me);
router.post(
  '/reset-password/question',
  validate(resetPasswordQuestionSchema),
  authController.getResetQuestion
);
router.post(
  '/reset-password/verify',
  validate(resetPasswordVerifySchema),
  authController.verifyReset
);

module.exports = router;

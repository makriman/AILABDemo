const rateLimit = require('express-rate-limit');

const skipDuringTests = () => process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDuringTests,
  message: { error: 'Too many requests. Please try again later.' },
});

const quizGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDuringTests,
  message: { error: 'Quiz generation limit reached. Please try again shortly.' },
});

const quizSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDuringTests,
  message: { error: 'Submission limit reached. Please try again shortly.' },
});

module.exports = {
  globalLimiter,
  quizGenerationLimiter,
  quizSubmissionLimiter,
};

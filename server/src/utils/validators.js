const Joi = require('joi');

const usernamePattern = /^[A-Za-z0-9_]{3,30}$/;

const signupSchema = Joi.object({
  username: Joi.string().pattern(usernamePattern).required().messages({
    'string.pattern.base': 'Username must be 3-30 chars and contain only letters, numbers, and underscores.',
  }),
  password: Joi.string().min(8).required(),
  securityQuestion: Joi.string().min(1).max(300).required(),
  securityAnswer: Joi.string().min(1).max(300).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const resetPasswordQuestionSchema = Joi.object({
  username: Joi.string().required(),
});

const resetPasswordVerifySchema = Joi.object({
  username: Joi.string().required(),
  securityAnswer: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const createQuizSchema = Joi.object({
  jobDescription: Joi.string().min(50).max(15000).required().messages({
    'string.min': 'Job description must be at least 50 characters long.',
    'string.max': 'Job description must be no more than 15000 characters long.',
  }),
});

const submitQuizSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required(),
        selectedAnswer: Joi.string().valid('A', 'B', 'C', 'D').required(),
      })
    )
    .length(5)
    .required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  resetPasswordQuestionSchema,
  resetPasswordVerifySchema,
  createQuizSchema,
  submitQuizSchema,
};

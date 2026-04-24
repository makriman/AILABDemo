const Joi = require('joi');

const generateQuizSchema = Joi.object({
  jobDescription: Joi.string().trim().min(50).max(15000).required().messages({
    'string.empty': 'Please paste a job description before submitting.',
    'string.min': 'Job description must be at least 50 characters long.',
    'string.max': 'Job description must be no more than 15000 characters long.',
  }),
});

const submitQuizSchema = Joi.object({
  attemptToken: Joi.string().trim().required().messages({
    'string.empty': 'attemptToken is required.',
    'any.required': 'attemptToken is required.',
  }),
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().trim().required(),
        selectedAnswer: Joi.string().uppercase().valid('A', 'B', 'C', 'D').required(),
      })
    )
    .length(5)
    .required()
    .custom((answers, helpers) => {
      const ids = answers.map((answer) => answer.questionId);
      if (new Set(ids).size !== ids.length) {
        return helpers.error('any.invalid');
      }
      return answers;
    }, 'unique question ids')
    .messages({
      'array.length': 'All 5 questions must be answered before submitting.',
      'any.invalid': 'Each question must be answered once.',
    }),
});

module.exports = {
  generateQuizSchema,
  submitQuizSchema,
};

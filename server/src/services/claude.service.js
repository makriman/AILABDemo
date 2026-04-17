const axios = require('axios');
const { buildSystemPrompt, buildUserPrompt } = require('../utils/prompt');

class ClaudeServiceError extends Error {
  constructor(message, statusCode = 500, retryable = false) {
    super(message);
    this.name = 'ClaudeServiceError';
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

function extractTextFromClaudeResponse(responseData) {
  if (!responseData || !Array.isArray(responseData.content)) {
    throw new ClaudeServiceError('Malformed Claude response.', 500, true);
  }

  const text = responseData.content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new ClaudeServiceError('Claude returned empty content.', 500, true);
  }

  return text;
}

function parseJsonFromText(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (primaryError) {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new ClaudeServiceError('Could not parse JSON from Claude response.', 500, true);
    }

    const possibleJson = rawText.slice(start, end + 1);

    try {
      return JSON.parse(possibleJson);
    } catch (secondaryError) {
      throw new ClaudeServiceError('Could not parse JSON from Claude response.', 500, true);
    }
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ClaudeServiceError(`Invalid ${fieldName} in Claude response.`, 500, true);
  }
}

function validateAndNormalizeQuestion(question, index) {
  if (!question || typeof question !== 'object') {
    throw new ClaudeServiceError('Question object is invalid.', 500, true);
  }

  assertNonEmptyString(question.questionText, `questionText for q${index + 1}`);

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new ClaudeServiceError(`Question q${index + 1} must contain exactly 4 options.`, 500, true);
  }

  const normalizedOptions = question.options.map((option) => {
    if (!option || typeof option !== 'object') {
      throw new ClaudeServiceError(`Invalid option structure in q${index + 1}.`, 500, true);
    }

    const label = typeof option.label === 'string' ? option.label.trim().toUpperCase() : '';
    if (!['A', 'B', 'C', 'D'].includes(label)) {
      throw new ClaudeServiceError(`Invalid option label in q${index + 1}.`, 500, true);
    }

    assertNonEmptyString(option.text, `option text ${label} in q${index + 1}`);

    return {
      label,
      text: option.text.trim(),
    };
  });

  const labels = normalizedOptions.map((option) => option.label);
  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size !== 4 || !['A', 'B', 'C', 'D'].every((label) => uniqueLabels.has(label))) {
    throw new ClaudeServiceError(`Options in q${index + 1} must include A, B, C, D exactly once.`, 500, true);
  }

  const correctAnswer =
    typeof question.correctAnswer === 'string' ? question.correctAnswer.trim().toUpperCase() : '';

  if (!uniqueLabels.has(correctAnswer)) {
    throw new ClaudeServiceError(`Invalid correctAnswer in q${index + 1}.`, 500, true);
  }

  assertNonEmptyString(question.explanation, `explanation for q${index + 1}`);

  if (!question.wrongExplanations || typeof question.wrongExplanations !== 'object') {
    throw new ClaudeServiceError(`wrongExplanations missing in q${index + 1}.`, 500, true);
  }

  const wrongExplanations = {};
  ['A', 'B', 'C', 'D'].forEach((label) => {
    if (label === correctAnswer) {
      return;
    }

    const explanation = question.wrongExplanations[label];
    if (typeof explanation !== 'string' || !explanation.trim()) {
      throw new ClaudeServiceError(
        `wrongExplanations must include non-empty text for option ${label} in q${index + 1}.`,
        500,
        true
      );
    }

    wrongExplanations[label] = explanation.trim();
  });

  const orderedOptions = ['A', 'B', 'C', 'D'].map((label) =>
    normalizedOptions.find((option) => option.label === label)
  );

  return {
    questionId: `q${index + 1}`,
    questionText: question.questionText.trim(),
    options: orderedOptions,
    correctAnswer,
    explanation: question.explanation.trim(),
    wrongExplanations,
  };
}

function validateAndNormalizeQuizPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new ClaudeServiceError('Claude payload is invalid.', 500, true);
  }

  assertNonEmptyString(payload.jobTitle, 'jobTitle');
  assertNonEmptyString(payload.learningSummary, 'learningSummary');

  if (!Array.isArray(payload.questions) || payload.questions.length !== 5) {
    throw new ClaudeServiceError('Claude must return exactly 5 questions.', 500, true);
  }

  const questions = payload.questions.map((question, index) =>
    validateAndNormalizeQuestion(question, index)
  );

  return {
    jobTitle: payload.jobTitle.trim(),
    questions,
    learningSummary: payload.learningSummary.trim(),
  };
}

async function callClaude(jobDescription, strictMode = false) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new ClaudeServiceError('CLAUDE_API_KEY is missing on the server.', 500, false);
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: 4000,
        temperature: 0.2,
        system: buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: buildUserPrompt(jobDescription, strictMode),
          },
        ],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new ClaudeServiceError('Claude API rate limit exceeded.', 429, false);
    }

    if (error.code === 'ECONNABORTED') {
      throw new ClaudeServiceError('Claude API request timed out.', 500, true);
    }

    if (error instanceof ClaudeServiceError) {
      throw error;
    }

    throw new ClaudeServiceError('Failed to call Claude API.', 500, true);
  }
}

async function generateQuizFromJobDescription(jobDescription) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const strictMode = attempt === 1;

    try {
      const rawResponse = await callClaude(jobDescription, strictMode);
      const text = extractTextFromClaudeResponse(rawResponse);
      const json = parseJsonFromText(text);
      return validateAndNormalizeQuizPayload(json);
    } catch (error) {
      if (error instanceof ClaudeServiceError && error.statusCode === 429) {
        throw error;
      }

      lastError =
        error instanceof ClaudeServiceError
          ? error
          : new ClaudeServiceError('Unexpected quiz generation error.', 500, true);

      if (!lastError.retryable) {
        break;
      }
    }
  }

  if (lastError && lastError.statusCode === 429) {
    throw lastError;
  }

  throw new ClaudeServiceError('Failed to generate quiz. Please try again.', 500, false);
}

module.exports = {
  generateQuizFromJobDescription,
  ClaudeServiceError,
  validateAndNormalizeQuizPayload,
  parseJsonFromText,
};

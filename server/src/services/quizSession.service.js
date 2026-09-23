const crypto = require('crypto');
const { assertQuizStateSecretConfigured, readQuizStateSecret } = require('../utils/quizStateSecret');
const { redactSecrets } = require('../utils/redactSecrets');

const TOKEN_VERSION = 'v1';
const TOKEN_ISSUER = 'jd-quiz';
const TOKEN_AUDIENCE = 'quiz-submit';
const TOKEN_TTL_MS = 30 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;
const IV_LENGTH = 12;
const MAX_TOKEN_LENGTH = 100000;
const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D']);

class QuizSessionError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'QuizSessionError';
    this.statusCode = statusCode;
  }
}

function getSecret() {
  try {
    assertQuizStateSecretConfigured();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(redactSecrets(error.message));
    throw new QuizSessionError('Quiz state is not configured.', 500);
  }

  return readQuizStateSecret();
}

function deriveKey() {
  return crypto.hkdfSync(
    'sha256',
    Buffer.from(getSecret(), 'utf8'),
    Buffer.from('jd-quiz', 'utf8'),
    Buffer.from('attempt-token-v1', 'utf8'),
    32
  );
}

function encodeBase64Url(buffer) {
  return buffer.toString('base64url');
}

function decodeBase64Url(value) {
  try {
    return Buffer.from(value, 'base64url');
  } catch (error) {
    throw new QuizSessionError('Invalid token.', 400);
  }
}

function assertAuthorizedPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  if (payload.v !== 1 || payload.iss !== TOKEN_ISSUER || payload.aud !== TOKEN_AUDIENCE) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  if (Date.now() > payload.exp) {
    throw new QuizSessionError('This temporary quiz has expired. Generate a new one.', 410);
  }

  if (payload.exp > Date.now() + TOKEN_TTL_MS + CLOCK_SKEW_MS) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  if (!Array.isArray(payload.questions) || payload.questions.length < 1 || payload.questions.length > 5) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  const questionIds = new Set();

  for (const question of payload.questions) {
    if (!question || typeof question !== 'object' || Array.isArray(question)) {
      throw new QuizSessionError('Invalid token.', 400);
    }

    if (typeof question.questionId !== 'string' || !question.questionId.trim()) {
      throw new QuizSessionError('Invalid token.', 400);
    }

    if (!VALID_ANSWERS.has(question.correctAnswer)) {
      throw new QuizSessionError('Invalid token.', 400);
    }

    if (questionIds.has(question.questionId)) {
      throw new QuizSessionError('Invalid token.', 400);
    }

    questionIds.add(question.questionId);
  }
}

function createAttemptToken(payload) {
  const now = Date.now();
  const exp = now + TOKEN_TTL_MS;
  const tokenPayload = {
    ...payload,
    v: 1,
    iss: TOKEN_ISSUER,
    aud: TOKEN_AUDIENCE,
    exp,
  };

  assertAuthorizedPayload(tokenPayload);

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey();

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(tokenPayload), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const attemptToken = [
    TOKEN_VERSION,
    encodeBase64Url(iv),
    encodeBase64Url(ciphertext),
    encodeBase64Url(authTag),
  ].join('.');

  return {
    attemptToken,
    expiresAt: new Date(exp).toISOString(),
  };
}

function decryptAttemptToken(attemptToken) {
  if (typeof attemptToken !== 'string' || !attemptToken.trim() || attemptToken.length > MAX_TOKEN_LENGTH) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  const parts = attemptToken.split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  const [, ivPart, cipherPart, tagPart] = parts;
  const iv = decodeBase64Url(ivPart);
  const ciphertext = decodeBase64Url(cipherPart);
  const authTag = decodeBase64Url(tagPart);

  if (iv.length !== IV_LENGTH || authTag.length !== 16 || ciphertext.length === 0) {
    throw new QuizSessionError('Invalid token.', 400);
  }

  try {
    const key = deriveKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const payload = JSON.parse(plaintext);
    assertAuthorizedPayload(payload);
    return payload;
  } catch (error) {
    if (error instanceof QuizSessionError) {
      throw error;
    }

    throw new QuizSessionError('Invalid token.', 400);
  }
}

module.exports = {
  TOKEN_TTL_MS,
  QuizSessionError,
  createAttemptToken,
  decryptAttemptToken,
};

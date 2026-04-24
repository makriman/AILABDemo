const crypto = require('crypto');

const TOKEN_VERSION = 'v1';
const TOKEN_TTL_MS = 30 * 60 * 1000;
const IV_LENGTH = 12;

class QuizSessionError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'QuizSessionError';
    this.statusCode = statusCode;
  }
}

function getSecret() {
  const secret = process.env.QUIZ_STATE_SECRET;

  if (!secret || !secret.trim()) {
    throw new QuizSessionError('QUIZ_STATE_SECRET is not configured.', 500);
  }

  return secret;
}

function deriveKey() {
  return crypto.createHash('sha256').update(getSecret(), 'utf8').digest();
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

function createAttemptToken(payload) {
  const now = Date.now();
  const exp = now + TOKEN_TTL_MS;
  const tokenPayload = {
    ...payload,
    v: 1,
    exp,
  };

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
  if (typeof attemptToken !== 'string' || !attemptToken.trim()) {
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

    if (!payload || typeof payload !== 'object' || typeof payload.exp !== 'number') {
      throw new QuizSessionError('Invalid token.', 400);
    }

    if (Date.now() > payload.exp) {
      throw new QuizSessionError('This temporary quiz has expired. Generate a new one.', 410);
    }

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

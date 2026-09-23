const crypto = require('crypto');

const MIN_GENERATION_SECRET_LENGTH = 16;
const MAX_PRESENTED_SECRET_LENGTH = 256;

function readGenerationSecret() {
  const secret = process.env.QUIZ_GENERATION_SECRET;
  if (typeof secret !== 'string') {
    return '';
  }

  return secret.trim();
}

function isGenerationEnabled() {
  return readGenerationSecret().length >= MIN_GENERATION_SECRET_LENGTH;
}

function secretsMatch(presentedSecret) {
  const expected = readGenerationSecret();
  const presented = typeof presentedSecret === 'string' ? presentedSecret.trim() : '';

  if (!expected || presented.length === 0 || presented.length > MAX_PRESENTED_SECRET_LENGTH) {
    return false;
  }

  const presentedHash = crypto.createHash('sha256').update(presented, 'utf8').digest();
  const expectedHash = crypto.createHash('sha256').update(expected, 'utf8').digest();

  return crypto.timingSafeEqual(presentedHash, expectedHash);
}

function assertGenerationAuthorized(presentedSecret) {
  if (!isGenerationEnabled()) {
    const error = new Error('Quiz generation is disabled.');
    error.statusCode = 503;
    throw error;
  }

  if (!secretsMatch(presentedSecret)) {
    const error = new Error('Unauthorized.');
    error.statusCode = 401;
    throw error;
  }
}

module.exports = {
  MIN_GENERATION_SECRET_LENGTH,
  readGenerationSecret,
  isGenerationEnabled,
  secretsMatch,
  assertGenerationAuthorized,
};

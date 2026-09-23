const MIN_QUIZ_STATE_SECRET_LENGTH = 32;
const PLACEHOLDER_QUIZ_STATE_SECRET = 'replace-with-a-long-random-secret';

function readQuizStateSecret() {
  const secret = process.env.QUIZ_STATE_SECRET;
  if (typeof secret !== 'string') {
    return '';
  }

  return secret.trim();
}

function assertQuizStateSecretConfigured() {
  const secret = readQuizStateSecret();

  if (!secret) {
    throw new Error('Missing required environment variables: QUIZ_STATE_SECRET');
  }

  if (secret.toLowerCase() === PLACEHOLDER_QUIZ_STATE_SECRET) {
    throw new Error(
      `QUIZ_STATE_SECRET is a placeholder. Set a unique random value of at least ${MIN_QUIZ_STATE_SECRET_LENGTH} characters.`
    );
  }

  if (secret.length < MIN_QUIZ_STATE_SECRET_LENGTH) {
    throw new Error(
      `QUIZ_STATE_SECRET must be at least ${MIN_QUIZ_STATE_SECRET_LENGTH} characters.`
    );
  }
}

module.exports = {
  MIN_QUIZ_STATE_SECRET_LENGTH,
  readQuizStateSecret,
  assertQuizStateSecretConfigured,
};

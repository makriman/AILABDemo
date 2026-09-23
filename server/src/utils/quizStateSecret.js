const MIN_QUIZ_STATE_SECRET_LENGTH = 32;

const PLACEHOLDER_QUIZ_STATE_SECRETS = new Set([
  'replace-with-a-long-random-secret',
  'replace-with-random-secret',
  'your-long-random-secret',
  'your-random-secret',
  'set-a-unique-random-value-at-least-32-chars',
  'changeme',
]);

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

  if (
    PLACEHOLDER_QUIZ_STATE_SECRETS.has(secret.toLowerCase()) ||
    secret.length < MIN_QUIZ_STATE_SECRET_LENGTH
  ) {
    throw new Error(
      `QUIZ_STATE_SECRET must be a unique random value of at least ${MIN_QUIZ_STATE_SECRET_LENGTH} characters.`
    );
  }
}

module.exports = {
  MIN_QUIZ_STATE_SECRET_LENGTH,
  readQuizStateSecret,
  assertQuizStateSecretConfigured,
};

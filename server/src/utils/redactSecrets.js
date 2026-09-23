const SECRET_ENV_NAMES = ['QUIZ_STATE_SECRET', 'CLAUDE_API_KEY', 'QUIZ_GENERATION_SECRET'];
const MIN_REDACT_LENGTH = 8;

function redactSecrets(value) {
  if (typeof value !== 'string' || !value) {
    return value;
  }

  let redacted = value;

  for (const name of SECRET_ENV_NAMES) {
    const secret = process.env[name];
    if (typeof secret !== 'string') {
      continue;
    }

    const trimmed = secret.trim();
    if (trimmed.length < MIN_REDACT_LENGTH) {
      continue;
    }

    redacted = redacted.split(trimmed).join('[redacted]');
  }

  return redacted;
}

module.exports = {
  redactSecrets,
};

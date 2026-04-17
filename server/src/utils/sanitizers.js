const sanitizeHtml = require('sanitize-html');

const MAX_GENERIC_STRING_LENGTH = 20000;

function sanitizeString(value, maxLength = MAX_GENERIC_STRING_LENGTH) {
  if (typeof value !== 'string') {
    return value;
  }

  const stripped = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return stripped.trim().slice(0, maxLength);
}

function sanitizeDeep(input) {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDeep(item));
  }

  if (input && typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[key] = sanitizeDeep(value);
      return acc;
    }, {});
  }

  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  return input;
}

module.exports = {
  sanitizeString,
  sanitizeDeep,
};

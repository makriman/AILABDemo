const { sanitizeDeep } = require('../utils/sanitizers');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    if (!req[source]) {
      return res.status(400).json({ error: 'Missing request payload.' });
    }

    req[source] = sanitizeDeep(req[source]);

    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: error.details.map((detail) => detail.message).join(' '),
      });
    }

    req[source] = value;
    return next();
  };
}

module.exports = validate;

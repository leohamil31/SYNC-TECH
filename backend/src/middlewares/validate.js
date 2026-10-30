const HttpError = require('../utils/http-error');

/**
 * Validates and coerces a request part (body, query or params) with a Zod schema.
 * The parsed value replaces the original so controllers receive clean data.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(HttpError.badRequest('Validation failed', details));
  }
  // Express 5 exposes req.query as a getter, so it cannot be reassigned.
  if (source === 'query') {
    Object.defineProperty(req, 'query', { value: result.data, writable: true });
  } else {
    req[source] = result.data;
  }
  return next();
};

module.exports = validate;

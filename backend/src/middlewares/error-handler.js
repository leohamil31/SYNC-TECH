const HttpError = require('../utils/http-error');
const { env } = require('../config/env');

// PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_CHECK_VIOLATION = '23514';

const notFoundHandler = (req, res, next) => {
  next(HttpError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.code === PG_UNIQUE_VIOLATION) {
    error = HttpError.conflict('A record with the same unique value already exists', {
      constraint: err.constraint,
      detail: err.detail,
    });
  } else if (err.code === PG_FOREIGN_KEY_VIOLATION) {
    const isDelete = /update or delete/.test(err.message);
    error = HttpError.conflict(
      isDelete
        ? 'This record is referenced by other records and cannot be removed'
        : 'A referenced record does not exist',
      { constraint: err.constraint, detail: err.detail },
    );
  } else if (err.code === PG_CHECK_VIOLATION) {
    error = HttpError.badRequest('A value is outside the allowed range', { constraint: err.constraint });
  } else if (err.type === 'entity.parse.failed') {
    error = HttpError.badRequest('Malformed JSON body');
  }

  const status = error instanceof HttpError ? error.status : 500;
  if (status === 500 && env !== 'test') {
    console.error(err);
  }

  res.status(status).json({
    error: {
      status,
      message: status === 500 ? 'Internal server error' : error.message,
      ...(error.details && { details: error.details }),
    },
  });
};

module.exports = { notFoundHandler, errorHandler };

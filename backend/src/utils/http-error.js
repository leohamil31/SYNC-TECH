class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new HttpError(400, message, details);
  }

  static notFound(message = 'Resource not found') {
    return new HttpError(404, message);
  }

  static conflict(message, details) {
    return new HttpError(409, message, details);
  }
}

module.exports = HttpError;

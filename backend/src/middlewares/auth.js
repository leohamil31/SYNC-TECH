const HttpError = require('../utils/http-error');
const authService = require('../services/auth.service');
const { auth } = require('../config/env');

const readCookie = (header, name) => {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
};

/**
 * Token sources, in order:
 *   1. `Authorization: Bearer <token>` — API clients, Swagger, tests
 *   2. httpOnly session cookie — the web app (the token is never readable by JavaScript)
 */
const tokenFrom = (req) => {
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return readCookie(req.headers.cookie, auth.cookieName);
};

/** Requires a valid session and exposes the current user as `req.user`. */
const authenticate = async (req, res, next) => {
  const token = tokenFrom(req);
  if (!token) return next(HttpError.unauthorized());

  const user = await authService.authenticate(token);
  if (!user) return next(HttpError.unauthorized('Session expired or invalid'));

  req.user = user;
  return next();
};

/** Allows the request only for the given roles. Use after `authenticate`. */
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(HttpError.forbidden());

module.exports = { authenticate, authorize };

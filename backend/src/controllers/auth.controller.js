const authService = require('../services/auth.service');
const { auth } = require('../config/env');

const cookieOptions = () => ({
  httpOnly: true,
  // Strict: the cookie is never sent on cross-site requests, which blocks CSRF.
  sameSite: 'strict',
  secure: auth.cookieSecure,
  path: '/api',
  maxAge: auth.tokenTtl * 1000,
});

const startSession = (res, status, { user, token, expiresIn }) => {
  res.cookie(auth.cookieName, token, cookieOptions());
  // The token is also returned for non-browser clients (Swagger, Postman, mobile).
  res.status(status).json({ user, token, expires_in: expiresIn });
};

module.exports = {
  login: async (req, res) => startSession(res, 200, await authService.login(req.body)),
  register: async (req, res) => startSession(res, 201, await authService.register(req.body)),
  me: (req, res) => res.json(req.user),
  logout: (req, res) => {
    const { maxAge, ...options } = cookieOptions();
    res.clearCookie(auth.cookieName, options);
    res.status(204).end();
  },
};

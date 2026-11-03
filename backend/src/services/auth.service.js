const db = require('../db/connection');
const HttpError = require('../utils/http-error');
const jwt = require('../utils/jwt');
const { hashPassword, verifyPassword, getDummyHash } = require('../utils/password');
const { auth } = require('../config/env');
const { USER_COLUMNS } = require('.');

const issueToken = (user) => jwt.sign({ sub: user.id, role: user.role }, auth.jwtSecret, auth.tokenTtl);

/**
 * Validates credentials. The error message is the same for unknown e-mail,
 * wrong password and inactive account so it cannot be used to enumerate users.
 */
const login = async ({ email, password }) => {
  const user = await db('users').where({ email }).first();
  // Hash a dummy password when the user does not exist, keeping response time constant.
  const valid = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));

  if (!user || !valid || user.status !== 'active') {
    throw HttpError.unauthorized('Invalid e-mail or password');
  }

  const [updated] = await db('users')
    .where({ id: user.id })
    .update({ last_login_at: db.fn.now() })
    .returning(USER_COLUMNS);

  return { user: updated, token: issueToken(updated), expiresIn: auth.tokenTtl };
};

/** Self sign-up. Always creates an active student; role escalation is admin-only. */
const register = async ({ name, email, password }) => {
  if (!auth.allowSignup) throw HttpError.forbidden('Sign-up is disabled');

  const [created] = await db('users')
    .insert({ name, email, password_hash: await hashPassword(password), role: 'student', status: 'active' })
    .returning(USER_COLUMNS);

  return { user: created, token: issueToken(created), expiresIn: auth.tokenTtl };
};

/**
 * Resolves a token to the current user. The user is re-read on every request,
 * so role changes and deactivation take effect immediately (not only at token expiry).
 */
const authenticate = async (token) => {
  const payload = jwt.verify(token, auth.jwtSecret);
  if (!payload) return null;

  const user = await db('users').select(USER_COLUMNS).where({ id: payload.sub }).first();
  if (!user || user.status !== 'active') return null;
  return user;
};

module.exports = { login, register, authenticate };

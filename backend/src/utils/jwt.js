const crypto = require('crypto');

/*
 * Minimal JWT (RFC 7519) implementation restricted to HS256.
 * Kept in-house to avoid a dependency for ~40 lines of well-defined crypto;
 * the algorithm is fixed on verification, so "alg: none" / key-confusion attacks do not apply.
 */

const HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

const signature = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

const sign = (payload, secret, ttlSeconds) => {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })).toString('base64url');
  const data = `${HEADER}.${body}`;
  return `${data}.${signature(data, secret)}`;
};

/** Returns the payload, or null when the token is malformed, tampered with or expired. */
const verify = (token, secret) => {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== HEADER) return null;

  const expected = Buffer.from(signature(`${parts[0]}.${parts[1]}`, secret));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

module.exports = { sign, verify };

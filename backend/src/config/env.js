require('dotenv').config({ quiet: true });

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

const DEV_JWT_SECRET = 'dev-only-insecure-secret-change-me';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? null : DEV_JWT_SECRET);

// Failing fast is safer than signing production tokens with a known secret.
if (!jwtSecret || (isProduction && jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be set (at least 32 characters) in production');
}

module.exports = {
  env,
  isProduction,
  port: Number(process.env.PORT) || 3333,
  databaseUrl:
    env === 'test'
      ? process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/courses_test'
      : process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/courses',
  // Heroku Postgres requires SSL but uses self-signed certificates.
  databaseSsl: process.env.DATABASE_SSL === 'true',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  auth: {
    jwtSecret,
    // Seconds. Default: 8 hours.
    tokenTtl: Number(process.env.JWT_TTL_SECONDS) || 8 * 60 * 60,
    cookieName: 'synctech_session',
    // Self sign-up creates student accounts only. Admins are created by other admins.
    allowSignup: process.env.ALLOW_SIGNUP !== 'false',
    // Secure cookies need HTTPS. Set COOKIE_SECURE=false only for plain-HTTP setups such as local Docker.
    cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction,
  },
  // Number of proxies in front of the app (Heroku router = 1). Needed for correct client IPs.
  trustProxy: Number(process.env.TRUST_PROXY ?? (isProduction ? 1 : 0)),
};

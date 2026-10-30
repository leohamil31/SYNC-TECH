require('dotenv').config({ quiet: true });

const env = process.env.NODE_ENV || 'development';

module.exports = {
  env,
  port: Number(process.env.PORT) || 3333,
  databaseUrl:
    env === 'test'
      ? process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/courses_test'
      : process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/courses',
  // Heroku Postgres requires SSL but uses self-signed certificates.
  databaseSsl: process.env.DATABASE_SSL === 'true',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

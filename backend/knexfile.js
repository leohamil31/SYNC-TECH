const path = require('path');
const { databaseUrl, databaseSsl } = require('./src/config/env');

module.exports = {
  client: 'pg',
  connection: {
    connectionString: databaseUrl,
    ssl: databaseSsl ? { rejectUnauthorized: false } : false,
  },
  pool: { min: 0, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'src/db/migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'src/db/seeds'),
  },
};

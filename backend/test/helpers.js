const db = require('../src/db/connection');

/** Recreates the schema and loads the seed data into the test database. */
const resetDatabase = async () => {
  await db.migrate.rollback(undefined, true);
  await db.migrate.latest();
  await db.seed.run();
};

module.exports = { db, resetDatabase };

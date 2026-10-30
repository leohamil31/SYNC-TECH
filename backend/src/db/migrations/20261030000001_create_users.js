/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 120).notNullable();
    table.string('email', 180).notNullable().unique();
    table.enu('status', ['active', 'inactive'], { useNative: true, enumName: 'user_status' })
      .notNullable()
      .defaultTo('active');
    table.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_status');
};

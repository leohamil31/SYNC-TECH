/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('courses', (table) => {
    table.increments('id').primary();
    table.string('code', 30).notNullable().unique();
    table.string('title', 150).notNullable();
    table.text('description');
    // Restrict: a user who authored records cannot be removed silently.
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.timestamps(true, true);
    table.index('user_id');
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('courses');

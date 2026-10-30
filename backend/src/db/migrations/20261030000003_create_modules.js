/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('modules', (table) => {
    table.increments('id').primary();
    table.integer('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('title', 150).notNullable();
    table.text('description');
    table.timestamps(true, true);
    table.index('course_id');
    table.index('user_id');
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('modules');

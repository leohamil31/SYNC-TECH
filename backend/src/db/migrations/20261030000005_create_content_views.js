/**
 * Tracks which users have watched which contents (lessons).
 * A separate N:N table is used instead of extra columns because a content
 * can be watched by many users and a user can watch many contents.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable('content_views', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('content_id').notNullable().references('id').inTable('contents').onDelete('CASCADE');
    table.timestamp('watched_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.unique(['user_id', 'content_id']);
    table.index('content_id');
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('content_views');

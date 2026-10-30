/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('contents', (table) => {
    table.increments('id').primary();
    table.integer('module_id').notNullable().references('id').inTable('modules').onDelete('CASCADE');
    table.string('title', 150).notNullable();
    table.text('content').notNullable();
    table.timestamps(true, true);
    table.index('module_id');
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('contents');

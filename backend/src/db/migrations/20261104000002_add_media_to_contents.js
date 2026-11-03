/**
 * Lessons become video lessons: a YouTube URL, an optional duration and an
 * explicit order inside the module. Courses get a publish flag so admins can
 * prepare a course before students see it.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.alterTable('contents', (table) => {
    table.string('video_url', 255);
    table.integer('duration_seconds');
    table.integer('position').notNullable().defaultTo(0);
    table.index(['module_id', 'position']);
  });
  await knex.raw(
    'ALTER TABLE contents ADD CONSTRAINT contents_duration_positive CHECK (duration_seconds IS NULL OR duration_seconds > 0)',
  );

  await knex.schema.alterTable('courses', (table) => {
    table.boolean('published').notNullable().defaultTo(true);
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('courses', (table) => table.dropColumn('published'));
  await knex.raw('ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_duration_positive');
  await knex.schema.alterTable('contents', (table) => {
    table.dropIndex(['module_id', 'position']);
    table.dropColumns('video_url', 'duration_seconds', 'position');
  });
};

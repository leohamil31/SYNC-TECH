/**
 * content_views turns into per-lesson progress:
 *   - a row exists as soon as the learner starts a lesson (watched_at = first access)
 *   - position_seconds lets the player resume where the learner stopped
 *   - completed_at marks the lesson as finished
 * Rows created before this migration meant "watched", so they are backfilled as completed.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.alterTable('content_views', (table) => {
    table.integer('position_seconds').notNullable().defaultTo(0);
    table.timestamp('completed_at', { useTz: true });
    table.index('user_id');
  });
  await knex('content_views').update({ completed_at: knex.ref('watched_at') });
  await knex.raw(
    'ALTER TABLE content_views ADD CONSTRAINT content_views_position_non_negative CHECK (position_seconds >= 0)',
  );
};

exports.down = async (knex) => {
  await knex.raw('ALTER TABLE content_views DROP CONSTRAINT IF EXISTS content_views_position_non_negative');
  await knex.schema.alterTable('content_views', (table) => {
    table.dropIndex('user_id');
    table.dropColumns('position_seconds', 'completed_at');
  });
};

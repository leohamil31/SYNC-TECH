/**
 * Adds authentication and authorization to users.
 * password_hash stays nullable so accounts created before this migration keep
 * existing; they just cannot sign in until an admin sets a password.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255);
    table.enu('role', ['student', 'admin'], { useNative: true, enumName: 'user_role' })
      .notNullable()
      .defaultTo('student');
    table.timestamp('last_login_at', { useTz: true });
    table.index('role');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex('role');
    table.dropColumns('password_hash', 'role', 'last_login_at');
  });
  await knex.raw('DROP TYPE IF EXISTS user_role');
};

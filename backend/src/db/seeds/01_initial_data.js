/**
 * Seeds the database with deterministic sample data:
 * - 5 users
 * - 5 courses, three of them shaped as requested in the test:
 *     course 1 -> 5 modules x 3 contents each
 *     course 2 -> 3 modules x 5 contents each
 *     course 3 -> 2 modules x 4 contents each
 *   plus two smaller courses so every table has at least 5 records.
 * - content views (who watched which lesson), including content id 2.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async (knex) => {
  await knex.raw(
    'TRUNCATE TABLE content_views, contents, modules, courses, users RESTART IDENTITY CASCADE',
  );

  const users = await knex('users')
    .insert([
      { name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
      { name: 'Bruno Silva', email: 'bruno@example.com', status: 'active' },
      { name: 'Carla Souza', email: 'carla@example.com', status: 'active' },
      { name: 'Daniel Costa', email: 'daniel@example.com', status: 'active' },
      { name: 'Eva Martins', email: 'eva@example.com', status: 'inactive' },
    ])
    .returning('id');
  const [alice, bruno, carla, daniel, eva] = users.map((u) => u.id);

  const courseDefinitions = [
    {
      course: { code: 'NODE-101', title: 'Node.js Fundamentals', description: 'Build back-end applications with Node.js.', user_id: alice },
      modules: 5,
      contentsPerModule: 3,
    },
    {
      course: { code: 'REACT-101', title: 'React from Scratch', description: 'Components, hooks and state management.', user_id: bruno },
      modules: 3,
      contentsPerModule: 5,
    },
    {
      course: { code: 'SQL-101', title: 'PostgreSQL Essentials', description: 'Relational modeling and SQL queries.', user_id: alice },
      modules: 2,
      contentsPerModule: 4,
    },
    {
      course: { code: 'DOCKER-101', title: 'Docker for Developers', description: 'Containers, images and Compose.', user_id: alice },
      modules: 1,
      contentsPerModule: 2,
    },
    {
      course: { code: 'GIT-101', title: 'Git and GitHub', description: 'Version control in practice.', user_id: carla },
      modules: 1,
      contentsPerModule: 1,
    },
  ];

  // Inserted sequentially (not in parallel) so generated ids are predictable.
  for (const definition of courseDefinitions) {
    const [{ id: courseId }] = await knex('courses').insert(definition.course).returning('id');

    for (let m = 1; m <= definition.modules; m += 1) {
      const [{ id: moduleId }] = await knex('modules')
        .insert({
          course_id: courseId,
          user_id: definition.course.user_id,
          title: `${definition.course.title} - Module ${m}`,
          description: `Module ${m} of ${definition.course.code}.`,
        })
        .returning('id');

      const contents = Array.from({ length: definition.contentsPerModule }, (_, i) => ({
        module_id: moduleId,
        title: `Lesson ${m}.${i + 1}`,
        content: `Content of lesson ${m}.${i + 1} from ${definition.course.code}.`,
      }));
      await knex('contents').insert(contents);
    }
  }

  await knex('content_views').insert([
    { user_id: alice, content_id: 1 },
    { user_id: alice, content_id: 2 },
    { user_id: carla, content_id: 2 },
    { user_id: daniel, content_id: 2 },
    { user_id: bruno, content_id: 16 },
    { user_id: eva, content_id: 31 },
  ]);
};

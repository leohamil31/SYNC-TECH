const { z } = require('zod');

const id = z.coerce.number().int().positive();
const optionalText = z.string().trim().max(5000).nullish();

const idParam = z.object({ id });

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
};

const user = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().max(180).pipe(z.email()),
  status: z.enum(['active', 'inactive']).default('active'),
});

const course = z.object({
  code: z.string().trim().min(2).max(30).toUpperCase(),
  title: z.string().trim().min(2).max(150),
  description: optionalText,
  user_id: id,
});

const moduleSchema = z.object({
  course_id: id,
  user_id: id,
  title: z.string().trim().min(2).max(150),
  description: optionalText,
});

const content = z.object({
  module_id: id,
  title: z.string().trim().min(2).max(150),
  content: z.string().trim().min(1).max(20000),
});

const contentView = z.object({
  user_id: id,
});

/**
 * PATCH bodies accept any subset of fields. Defaults are stripped so a partial
 * update never resets a field the client did not send.
 */
const partial = (schema) =>
  z
    .object(
      Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => [
          key,
          (value.removeDefault ? value.removeDefault() : value).optional(),
        ]),
      ),
    )
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

module.exports = {
  idParam,
  partial,
  user,
  course,
  module: moduleSchema,
  content,
  contentView,
  queries: {
    users: z.object({ ...pagination, status: z.enum(['active', 'inactive']).optional() }),
    courses: z.object({ ...pagination, user_id: id.optional() }),
    modules: z.object({ ...pagination, course_id: id.optional(), user_id: id.optional() }),
    contents: z.object({ ...pagination, module_id: id.optional(), course_id: id.optional() }),
  },
};

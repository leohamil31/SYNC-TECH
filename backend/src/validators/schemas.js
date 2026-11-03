const { z } = require('zod');
const { extractVideoId, watchUrl } = require('../utils/youtube');

const id = z.coerce.number().int().positive();
const optionalText = z.string().trim().max(5000).nullish();
const email = z.string().trim().toLowerCase().max(180).pipe(z.email());
// 8+ chars with at least one letter and one digit. Max 128 bounds scrypt input size.
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

/** Any YouTube URL format is accepted and stored in the canonical watch URL form. */
const youtubeUrl = z
  .string()
  .trim()
  .max(255)
  .refine((value) => extractVideoId(value) !== null, { message: 'Invalid YouTube URL' })
  .transform((value) => watchUrl(extractVideoId(value)));

const idParam = z.object({ id });

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
};

const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

/* ---------- admin CRUD ---------- */

const userBase = {
  name: z.string().trim().min(2).max(120),
  email,
  status: z.enum(['active', 'inactive']).default('active'),
  role: z.enum(['student', 'admin']).default('student'),
};

// Password is mandatory on create; on update it is optional (blank keeps the current one).
const user = z.object({ ...userBase, password });
const userUpdate = z.object({ ...userBase, password: password.optional() });

const course = z.object({
  code: z.string().trim().min(2).max(30).toUpperCase(),
  title: z.string().trim().min(2).max(150),
  description: optionalText,
  user_id: id,
  published: z.boolean().default(true),
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
  video_url: youtubeUrl.nullish(),
  duration_seconds: z.coerce.number().int().positive().max(86400).nullish(),
  position: z.coerce.number().int().min(0).max(10000).default(0),
});

const contentView = z.object({ user_id: id });

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

/* ---------- auth & learner ---------- */

const login = z.object({
  email,
  password: z.string().min(1).max(128),
});

const register = z.object({
  name: userBase.name,
  email,
  password,
});

const progress = z
  .object({
    position_seconds: z.coerce.number().int().min(0).max(86400).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.position_seconds !== undefined || data.completed !== undefined, {
    message: 'Send position_seconds and/or completed',
  });

module.exports = {
  idParam,
  partial,
  user,
  userUpdate,
  course,
  module: moduleSchema,
  content,
  contentView,
  login,
  register,
  progress,
  queries: {
    users: z.object({
      ...pagination,
      status: z.enum(['active', 'inactive']).optional(),
      role: z.enum(['student', 'admin']).optional(),
    }),
    courses: z.object({ ...pagination, user_id: id.optional(), published: booleanQuery.optional() }),
    modules: z.object({ ...pagination, course_id: id.optional(), user_id: id.optional() }),
    contents: z.object({ ...pagination, module_id: id.optional(), course_id: id.optional() }),
    catalog: z.object({ search: z.string().trim().min(1).max(100).optional() }),
  },
};

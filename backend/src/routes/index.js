const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate');
const rateLimit = require('../middlewares/rate-limit');
const { authenticate, authorize } = require('../middlewares/auth');
const schemas = require('../validators/schemas');
const services = require('../services');
const HttpError = require('../utils/http-error');
const createCrudRouter = require('./crud.routes');
const authController = require('../controllers/auth.controller');
const learnerController = require('../controllers/learner.controller');
const reportController = require('../controllers/report.controller');
const contentViewController = require('../controllers/content-view.controller');
const { env } = require('../config/env');

const router = Router();
const byId = validate(schemas.idParam, 'params');
const adminOnly = [authenticate, authorize('admin')];

// 10 attempts per 15 min per IP on credential endpoints (relaxed under test).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: env === 'test' ? 1000 : 10 });

router.get('/health', (req, res) => res.json({ status: 'ok' }));

/* ---------- authentication ---------- */

router.post('/auth/login', authLimiter, validate(schemas.login), authController.login);
router.post('/auth/register', authLimiter, validate(schemas.register), authController.register);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticate, authController.me);

/* ---------- learner area (any signed-in user) ---------- */

router.get('/me/summary', authenticate, learnerController.summary);
router.get('/me/courses', authenticate, validate(schemas.queries.catalog, 'query'), learnerController.courses);
router.get('/me/courses/:id', authenticate, byId, learnerController.course);
router.get('/me/lessons/:id', authenticate, byId, learnerController.lesson);
router.put('/me/lessons/:id/progress', authenticate, byId, validate(schemas.progress), learnerController.saveProgress);
router.delete('/me/lessons/:id/progress', authenticate, byId, learnerController.resetProgress);

/* ---------- admin area ---------- */

/** An admin cannot delete, deactivate or demote their own account (avoids locking everyone out). */
const preventSelfLockout = (req, res, next) => {
  if (req.params.id !== req.user.id) return next();
  if (req.method === 'DELETE') return next(HttpError.conflict('You cannot delete your own account'));
  if (req.body.role === 'student' || req.body.status === 'inactive') {
    return next(HttpError.conflict('You cannot remove your own admin access'));
  }
  return next();
};

// Viewer management, registered before the generic /contents router so paths do not clash.
router.get('/contents/:id/views', adminOnly, byId, contentViewController.list);
router.post('/contents/:id/views', adminOnly, byId, validate(schemas.contentView), contentViewController.create);
router.delete(
  '/contents/:id/views/:userId',
  adminOnly,
  validate(z.object({ id: schemas.idParam.shape.id, userId: schemas.idParam.shape.id }), 'params'),
  contentViewController.remove,
);

router.use(
  '/users',
  adminOnly,
  createCrudRouter({
    service: services.userService,
    schema: schemas.user,
    updateSchema: schemas.userUpdate,
    querySchema: schemas.queries.users,
    guards: { update: [preventSelfLockout], remove: [preventSelfLockout] },
  }),
);
router.use('/courses', adminOnly, createCrudRouter({ service: services.courseService, schema: schemas.course, querySchema: schemas.queries.courses }));
router.use('/modules', adminOnly, createCrudRouter({ service: services.moduleService, schema: schemas.module, querySchema: schemas.queries.modules }));
router.use('/contents', adminOnly, createCrudRouter({ service: services.contentService, schema: schemas.content, querySchema: schemas.queries.contents }));

router.get('/reports/users-most-courses', adminOnly, reportController.usersWithMostCourses);
router.get('/reports/course-most-contents', adminOnly, reportController.courseWithMostContents);
router.get('/reports/courses-summary', adminOnly, reportController.coursesSummary);
router.get('/reports/contents-with-course', adminOnly, reportController.contentsWithCourse);
router.get('/reports/course-completion', adminOnly, reportController.courseCompletion);
router.get('/reports/content-viewers/:id', adminOnly, byId, reportController.contentViewers);

module.exports = router;

const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate');
const schemas = require('../validators/schemas');
const services = require('../services');
const createCrudRouter = require('./crud.routes');
const reportController = require('../controllers/report.controller');
const contentViewController = require('../controllers/content-view.controller');

const router = Router();
const byId = validate(schemas.idParam, 'params');

router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Watch tracking: registered before the generic /contents router so paths do not clash.
router.get('/contents/:id/views', byId, contentViewController.list);
router.post('/contents/:id/views', byId, validate(schemas.contentView), contentViewController.create);
router.delete(
  '/contents/:id/views/:userId',
  validate(z.object({ id: schemas.idParam.shape.id, userId: schemas.idParam.shape.id }), 'params'),
  contentViewController.remove,
);

router.use('/users', createCrudRouter({ service: services.userService, schema: schemas.user, querySchema: schemas.queries.users }));
router.use('/courses', createCrudRouter({ service: services.courseService, schema: schemas.course, querySchema: schemas.queries.courses }));
router.use('/modules', createCrudRouter({ service: services.moduleService, schema: schemas.module, querySchema: schemas.queries.modules }));
router.use('/contents', createCrudRouter({ service: services.contentService, schema: schemas.content, querySchema: schemas.queries.contents }));

router.get('/reports/users-most-courses', reportController.usersWithMostCourses);
router.get('/reports/course-most-contents', reportController.courseWithMostContents);
router.get('/reports/courses-summary', reportController.coursesSummary);
router.get('/reports/contents-with-course', reportController.contentsWithCourse);
router.get('/reports/content-viewers/:id', byId, reportController.contentViewers);

module.exports = router;

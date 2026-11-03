const { Router } = require('express');
const validate = require('../middlewares/validate');
const { idParam, partial } = require('../validators/schemas');
const createCrudController = require('../controllers/crud.controller');

/**
 * Standard REST routes for a resource:
 *   GET /  GET /:id  POST /  PUT /:id  PATCH /:id  DELETE /:id
 *
 * `updateSchema` lets a resource validate updates differently from creation
 * (e.g. the user password is required on create and optional on update).
 * `guards` run before update/delete handlers (e.g. self-lockout protection).
 */
const createCrudRouter = ({ service, schema, updateSchema = schema, querySchema, guards = {} }) => {
  const router = Router();
  const controller = createCrudController(service);
  const byId = validate(idParam, 'params');
  const updateGuards = guards.update || [];
  const removeGuards = guards.remove || [];

  router.get('/', validate(querySchema, 'query'), controller.list);
  router.get('/:id', byId, controller.show);
  router.post('/', validate(schema), controller.create);
  router.put('/:id', byId, validate(updateSchema), ...updateGuards, controller.update);
  router.patch('/:id', byId, validate(partial(updateSchema)), ...updateGuards, controller.update);
  router.delete('/:id', byId, ...removeGuards, controller.remove);

  return router;
};

module.exports = createCrudRouter;

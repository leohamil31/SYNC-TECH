const { Router } = require('express');
const validate = require('../middlewares/validate');
const { idParam, partial } = require('../validators/schemas');
const createCrudController = require('../controllers/crud.controller');

/**
 * Standard REST routes for a resource:
 *   GET /  GET /:id  POST /  PUT /:id  PATCH /:id  DELETE /:id
 */
const createCrudRouter = ({ service, schema, querySchema }) => {
  const router = Router();
  const controller = createCrudController(service);
  const byId = validate(idParam, 'params');

  router.get('/', validate(querySchema, 'query'), controller.list);
  router.get('/:id', byId, controller.show);
  router.post('/', validate(schema), controller.create);
  router.put('/:id', byId, validate(schema), controller.update);
  router.patch('/:id', byId, validate(partial(schema)), controller.update);
  router.delete('/:id', byId, controller.remove);

  return router;
};

module.exports = createCrudRouter;

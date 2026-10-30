/** Maps HTTP requests to a CRUD service. Validation happens in route middlewares. */
const createCrudController = (service) => ({
  list: async (req, res) => res.json(await service.list(req.query)),
  show: async (req, res) => res.json(await service.findById(req.params.id)),
  create: async (req, res) => res.status(201).json(await service.create(req.body)),
  update: async (req, res) => res.json(await service.update(req.params.id, req.body)),
  remove: async (req, res) => {
    await service.remove(req.params.id);
    res.status(204).end();
  },
});

module.exports = createCrudController;

const views = require('../services/content-view.service');

module.exports = {
  list: async (req, res) => res.json(await views.listViewers(req.params.id)),
  create: async (req, res) =>
    res.status(201).json(await views.markAsWatched(req.params.id, req.body.user_id)),
  remove: async (req, res) => {
    await views.unmarkAsWatched(req.params.id, req.params.userId);
    res.status(204).end();
  },
};

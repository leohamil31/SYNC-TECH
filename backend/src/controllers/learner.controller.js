const learner = require('../services/learner.service');

module.exports = {
  summary: async (req, res) => res.json(await learner.getSummary(req.user)),
  courses: async (req, res) => res.json(await learner.listCourses(req.user, req.query)),
  course: async (req, res) => res.json(await learner.getCourse(req.user, req.params.id)),
  lesson: async (req, res) => res.json(await learner.getLesson(req.user, req.params.id)),
  saveProgress: async (req, res) => res.json(await learner.saveProgress(req.user, req.params.id, req.body)),
  resetProgress: async (req, res) => {
    await learner.resetProgress(req.user, req.params.id);
    res.status(204).end();
  },
};

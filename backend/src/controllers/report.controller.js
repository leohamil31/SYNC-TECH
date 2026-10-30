const reports = require('../services/report.service');

module.exports = {
  usersWithMostCourses: async (req, res) => res.json(await reports.usersWithMostCourses()),
  courseWithMostContents: async (req, res) => res.json(await reports.courseWithMostContents()),
  coursesSummary: async (req, res) => res.json(await reports.coursesSummary()),
  contentsWithCourse: async (req, res) => res.json(await reports.contentsWithCourse()),
  contentViewers: async (req, res) => res.json(await reports.contentViewers(req.params.id)),
};

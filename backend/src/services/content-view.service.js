const db = require('../db/connection');
const { contentService } = require('.');
const { contentViewers } = require('./report.service');
const HttpError = require('../utils/http-error');

/*
 * Admin-side management of who completed a lesson.
 * Learners update their own progress through learner.service.js.
 */

const listViewers = async (contentId) => {
  await contentService.findById(contentId);
  return contentViewers(contentId);
};

/** Marks a lesson as completed for a user. Idempotent: keeps the first completion date. */
const markAsWatched = async (contentId, userId) => {
  await contentService.findById(contentId);
  const [view] = await db('content_views')
    .insert({ content_id: contentId, user_id: userId, completed_at: db.fn.now() })
    .onConflict(['user_id', 'content_id'])
    .merge({
      completed_at: db.raw('COALESCE(content_views.completed_at, now())'),
      updated_at: db.fn.now(),
    })
    .returning(['id', 'user_id', 'content_id', 'watched_at', 'completed_at']);
  return view;
};

/** Removes the completion mark (the learner's resume position is kept). */
const unmarkAsWatched = async (contentId, userId) => {
  const affected = await db('content_views')
    .where({ content_id: contentId, user_id: userId })
    .whereNotNull('completed_at')
    .update({ completed_at: null, updated_at: db.fn.now() });
  if (!affected) throw HttpError.notFound(`User ${userId} has not watched content ${contentId}`);
};

module.exports = { listViewers, markAsWatched, unmarkAsWatched };

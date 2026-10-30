const db = require('../db/connection');
const { contentService } = require('.');
const { contentViewers } = require('./report.service');
const HttpError = require('../utils/http-error');

const listViewers = async (contentId) => {
  await contentService.findById(contentId);
  return contentViewers(contentId);
};

/** Marks a content as watched by a user. Idempotent: watching twice keeps the first date. */
const markAsWatched = async (contentId, userId) => {
  await contentService.findById(contentId);
  const [view] = await db('content_views')
    .insert({ content_id: contentId, user_id: userId })
    .onConflict(['user_id', 'content_id'])
    .merge({ updated_at: db.fn.now() })
    .returning(['id', 'user_id', 'content_id', 'watched_at']);
  return view;
};

const unmarkAsWatched = async (contentId, userId) => {
  const affected = await db('content_views').where({ content_id: contentId, user_id: userId }).del();
  if (!affected) throw HttpError.notFound(`User ${userId} has not watched content ${contentId}`);
};

module.exports = { listViewers, markAsWatched, unmarkAsWatched };

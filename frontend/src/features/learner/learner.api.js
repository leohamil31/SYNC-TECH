import { http, toQuery } from '../../shared/api/client';

export const learnerApi = {
  summary: (signal) => http.get('/me/summary', { signal }),
  courses: (params, signal) => http.get(`/me/courses${toQuery(params)}`, { signal }),
  course: (id, signal) => http.get(`/me/courses/${id}`, { signal }),
  lesson: (id, signal) => http.get(`/me/lessons/${id}`, { signal }),
  saveProgress: (id, progress, options) => http.put(`/me/lessons/${id}/progress`, progress, options),
  resetProgress: (id) => http.delete(`/me/lessons/${id}/progress`),
};

/** Learner status of a course, derived from the progress counters. */
export const courseStatus = (course) => {
  if (!course.started_lessons && !course.completed_lessons) return 'notStarted';
  if (course.lessons_count && course.completed_lessons >= course.lessons_count) return 'completed';
  return 'inProgress';
};

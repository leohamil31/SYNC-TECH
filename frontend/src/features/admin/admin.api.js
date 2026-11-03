import { http, toQuery } from '../../shared/api/client';

export const adminApi = {
  list: (resource, params, signal) => http.get(`/${resource}${toQuery(params)}`, { signal }),
  get: (resource, id, signal) => http.get(`/${resource}/${id}`, { signal }),
  create: (resource, data) => http.post(`/${resource}`, data),
  update: (resource, id, data) => http.put(`/${resource}/${id}`, data),
  patch: (resource, id, data) => http.patch(`/${resource}/${id}`, data),
  remove: (resource, id) => http.delete(`/${resource}/${id}`),

  report: (name, signal) => http.get(`/reports/${name}`, { signal }),

  viewers: (contentId, signal) => http.get(`/contents/${contentId}/views`, { signal }),
  markViewed: (contentId, userId) => http.post(`/contents/${contentId}/views`, { user_id: userId }),
  unmarkViewed: (contentId, userId) => http.delete(`/contents/${contentId}/views/${userId}`),
};

/** Fetches every page of a resource; used to fill select boxes. */
export async function listAll(resource, params, signal) {
  const first = await adminApi.list(resource, { ...params, limit: 100, page: 1 }, signal);
  const pages = [first];
  for (let page = 2; page <= first.meta.total_pages; page += 1) {
    pages.push(await adminApi.list(resource, { ...params, limit: 100, page }, signal));
  }
  return pages.flatMap((p) => p.data);
}

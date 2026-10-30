import { mockRequest } from './mock';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
/** GitHub Pages build: no backend, the API runs in the browser (see mock.js). */
export const DEMO = import.meta.env.VITE_DEMO === 'true';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body) {
  if (DEMO) return mockRequest(method, path, body, ApiError);

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(response.status, error?.message || response.statusText, error?.details);
  }
  return payload;
}

const toQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export const api = {
  list: (resource, params) => request('GET', `/${resource}${toQuery(params)}`),
  get: (resource, id) => request('GET', `/${resource}/${id}`),
  create: (resource, data) => request('POST', `/${resource}`, data),
  update: (resource, id, data) => request('PUT', `/${resource}/${id}`, data),
  remove: (resource, id) => request('DELETE', `/${resource}/${id}`),
};

/** Low level access for non-CRUD endpoints (reports, content views). */
export const http = {
  get: (path) => request('GET', path),
  post: (path, data) => request('POST', path, data),
  delete: (path) => request('DELETE', path),
};

/** Fetches every page of a resource; used to fill select boxes. */
export async function listAll(resource, params) {
  const first = await api.list(resource, { ...params, limit: 100, page: 1 });
  const pages = [first];
  for (let page = 2; page <= first.meta.total_pages; page += 1) {
    pages.push(await api.list(resource, { ...params, limit: 100, page }));
  }
  return pages.flatMap((p) => p.data);
}

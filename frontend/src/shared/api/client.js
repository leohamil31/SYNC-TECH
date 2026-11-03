const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Called on any 401 so the auth layer can drop the session (registered by AuthProvider). */
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

/**
 * JSON fetch wrapper. The session travels in an httpOnly cookie
 * (`credentials: 'include'`), so no token is ever stored in JavaScript.
 */
async function request(method, path, body, { signal, keepalive, silent401 = false } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      // keepalive lets progress saves finish while the tab is closing.
      keepalive,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Failed to fetch');
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !silent401) onUnauthorized();
    const error = payload?.error;
    throw new ApiError(response.status, error?.message || response.statusText, error?.details);
  }
  return payload;
}

export const http = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, data, options) => request('POST', path, data, options),
  put: (path, data, options) => request('PUT', path, data, options),
  patch: (path, data, options) => request('PATCH', path, data, options),
  delete: (path, options) => request('DELETE', path, undefined, options),
};

export const toQuery = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

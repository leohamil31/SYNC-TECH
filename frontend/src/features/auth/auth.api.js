import { http } from '../../shared/api/client';

export const authApi = {
  me: (options) => http.get('/auth/me', { silent401: true, ...options }),
  login: (credentials) => http.post('/auth/login', credentials, { silent401: true }),
  register: (data) => http.post('/auth/register', data, { silent401: true }),
  logout: () => http.post('/auth/logout'),
};

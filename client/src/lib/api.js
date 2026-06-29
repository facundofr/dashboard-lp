const BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error' }));
    throw new Error(err.message || 'Error del servidor');
  }
  return res.json();
}

export const api = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLandings: () => request('/landings'),

  getLanding: (id) => request(`/landings/${id}`),

  createLanding: (data) =>
    request('/landings', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  updateLanding: (id, data) =>
    request(`/landings/${id}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  deleteLanding: (id) =>
    request(`/landings/${id}`, { method: 'DELETE' }),

  checkLanding: (id) =>
    request(`/landings/${id}/check`, { method: 'POST' }),

  checkAllLandings: () =>
    request('/landings/check-all', { method: 'POST' }),

  getLandingLogs: (id) =>
    request(`/landings/${id}/logs`),
};

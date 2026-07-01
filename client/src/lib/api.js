const BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED' || body.code === 'INVALID_TOKEN') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
    throw new Error(body.message || 'No autorizado');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error del servidor' }));
    throw new Error(err.message || 'Error del servidor');
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getLandings: (page = 1, limit = 50, search = '') => {
    const params = new URLSearchParams({ page, limit, search });
    return request(`/landings?${params}`);
  },

  getLanding: (id) => request(`/landings/${id}`),

  createLanding: (data) =>
    request('/landings', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),

  updateLanding: (id, data) =>
    request(`/landings/${id}`, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),

  deleteLanding: (id) => request(`/landings/${id}`, { method: 'DELETE' }),

  checkLanding: (id) => request(`/landings/${id}/check`, { method: 'POST' }),

  checkAllLandings: () => request('/landings/check-all', { method: 'POST' }),

  getLandingLogs: (id) => request(`/landings/${id}/logs`),

  getAuditLogs: () => request('/landings/audit/all'),

  registerDeploy: (id) => request(`/landings/${id}/deploy`, { method: 'POST' }),

  getUserSettings: () => request('/auth/me'),

  updateUserSettings: (data) =>
    request('/auth/settings', { method: 'PUT', body: JSON.stringify(data) }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (data) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/upload/image', { method: 'POST', body: formData });
  },

  getWebhooks: () => request('/webhooks'),
  createWebhook: (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) }),
  updateWebhook: (id, data) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWebhook: (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
  testWebhook: (url) => request('/webhooks/test', { method: 'POST', body: JSON.stringify({ url }) }),

  getUsers: () => request('/auth/users'),
  updateUserRole: (id, role) => request(`/auth/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  bulkCheckLandings: (ids) => request('/landings/bulk/check', { method: 'POST', body: JSON.stringify({ ids }) }),
  bulkDeleteLandings: (ids) => request('/landings/bulk/delete', { method: 'POST', body: JSON.stringify({ ids }) }),

  exportCSV: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}/landings/export/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Error al exportar');
    return res.blob();
  },

  getApiKeys: () => request('/auth/api-keys'),
  createApiKey: (data) => request('/auth/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  deleteApiKey: (id) => request(`/auth/api-keys/${id}`, { method: 'DELETE' }),

  updatePlan: (plan) => request('/auth/plan', { method: 'PUT', body: JSON.stringify({ plan }) }),

  getStats: () => request('/auth/stats'),

  getStatusPage: () => request('/status/me'),
  updateStatusPage: (data) => request('/status/me', { method: 'PUT', body: JSON.stringify(data) }),
  updateStatusPageSlug: (slug) => request('/status/me/slug', { method: 'PUT', body: JSON.stringify({ slug }) }),

  getPublicStatusPage: (slug) => request(`/status/by-slug/${slug}`),
  getPublicUptime: (slug, landingId) => request(`/status/${slug}/uptime/${landingId}`),
};
const BASE = import.meta.env.VITE_API_URL || '/api';

let isRefreshing = false;
let refreshQueue = [];

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED') {
      const newToken = await attemptRefresh();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BASE}${path}`, { ...options, headers });
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) return res.json();
          return res;
        }
      }
    }
    if (body.code === 'TOKEN_EXPIRED' || body.code === 'INVALID_TOKEN' || body.code === 'NO_TOKEN') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      throw new Error('Sesión expirada');
    }
    throw new Error(body.message || 'No autorizado');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Error del servidor' }));
    const error = new Error(body.message || 'Error del servidor');
    error.status = res.status;
    error.data = body;
    throw error;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

async function attemptRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      isRefreshing = false;
      refreshQueue.forEach((r) => r(null));
      refreshQueue = [];
      return null;
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    isRefreshing = false;
    refreshQueue.forEach((r) => r(data.token));
    refreshQueue = [];
    return data.token;
  } catch {
    isRefreshing = false;
    refreshQueue.forEach((r) => r(null));
    refreshQueue = [];
    return null;
  }
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

  setLandingCategoria: (id, categoria) =>
    request(`/landings/${id}/categoria`, { method: 'POST', body: JSON.stringify({ categoria }) }),

  bulkSetCategoria: (ids, categoria) =>
    request('/landings/bulk/categoria', { method: 'POST', body: JSON.stringify({ ids, categoria }) }),

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
  toggleUserStatus: (id) => request(`/auth/users/${id}/toggle-status`, { method: 'PUT' }),
  approveUser: (id) => request(`/auth/users/${id}/approve`, { method: 'PUT' }),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),

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

  updatePlan: (plan) => request('/auth/plan', { method: 'PUT', body: JSON.stringify({ plan }) }),

  getStats: () => request('/auth/stats'),

  getStatusPage: () => request('/status/me'),
  updateStatusPage: (data) => request('/status/me', { method: 'PUT', body: JSON.stringify(data) }),
  updateStatusPageSlug: (slug) => request('/status/me/slug', { method: 'PUT', body: JSON.stringify({ slug }) }),

  getPublicStatusPage: (slug) => request(`/status/by-slug/${slug}`),
  getPublicUptime: (slug, landingId) => request(`/status/${slug}/uptime/${landingId}`),

  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id, reassignTo) =>
    request(`/categories/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ''}`, { method: 'DELETE' }),

  getTemplateTypes: () => request('/template-types'),
  createTemplateType: (data) => request('/template-types', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplateType: (id, data) => request(`/template-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplateType: (id) => request(`/template-types/${id}`, { method: 'DELETE' }),

  getFieldDefinitions: (typeId) => request(`/template-types/${typeId}/fields`),
  createFieldDefinition: (typeId, data) => request(`/template-types/${typeId}/fields`, { method: 'POST', body: JSON.stringify(data) }),
  updateFieldDefinition: (typeId, fieldId, data) => request(`/template-types/${typeId}/fields/${fieldId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFieldDefinition: (typeId, fieldId) => request(`/template-types/${typeId}/fields/${fieldId}`, { method: 'DELETE' }),

  getNotifications: () => request('/notifications'),
  createNotification: (data) => request('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  markNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  clearNotifications: () => request('/notifications/clear', { method: 'DELETE' }),

  getActiveIncidents: () => request('/incidents'),
  getIncidentHistory: (page = 1, limit = 20) => request(`/incidents/history?page=${page}&limit=${limit}`),
  getIncident: (id) => request(`/incidents/${id}`),
  acknowledgeIncident: (id) => request(`/incidents/${id}/acknowledge`, { method: 'PUT' }),
};
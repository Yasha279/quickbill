import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  restock: (id, quantity) => api.patch(`/products/restock/${id}`, { quantity }),
  getCategories: () => api.get('/products/categories/list'),
};

export const inventoryAPI = {
  getLowStock: () => api.get('/inventory/low-stock'),
  getLogs: (params) => api.get('/inventory/logs', { params }),
};

export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/orders/cancel/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: (params) => api.get('/dashboard/charts', { params }),
};

export const reportsAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getInventory: (params) => api.get('/reports/inventory', { params }),
  export: (params) =>
    api.get('/reports/export', { params, responseType: 'blob' }),
  getStaff: () => api.get('/reports/staff'),
};

export const aiAPI = {
  generateDescription: (data) => api.post('/ai/generate-description', data),
  salesSummary: () => api.post('/ai/sales-summary'),
  restockSuggestions: () => api.post('/ai/restock-suggestions'),
  trendInsight: () => api.get('/ai/trend-insight'),
  naturalSearch: (data) => api.post('/ai/natural-search', data),
};

export const shopAPI = {
  getInfo: () => api.get('/shop/info'),
};

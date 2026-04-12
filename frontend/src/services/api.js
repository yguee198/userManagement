import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors - logout user
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  sendOTP: async (email) => {
    const response = await api.post('/auth/otp/send/', { email });
    return response.data;
  },

  verifyOTP: async (data) => {
    const response = await api.post('/auth/otp/verify/', data);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch (e) {
      // Continue with logout
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me/');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/users/me/update/', data);
    return response.data;
  },

  changePassword: async (oldPassword, newPassword, newPasswordConfirm) => {
    const response = await api.post('/users/me/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get('/users/permissions/');
    return response.data;
  },
};

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users/create/', userData);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.patch(`/users/${id}/`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.post('/users/role/update/', {
      user_id: userId,
      role: role,
    });
    return response.data;
  },

  toggleUserActive: async (userId, isActive) => {
    const response = await api.post('/users/toggle-active/', {
      user_id: userId,
      is_active: isActive,
    });
    return response.data;
  },
};

export default api;
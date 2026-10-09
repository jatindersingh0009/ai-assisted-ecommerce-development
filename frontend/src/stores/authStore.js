import { defineStore } from 'pinia';
import api from '../services/api';

const normalizeUser = (user = null) => {
  if (!user) return null;

  return {
    ...user,
    id: user.id,
    firstName: user.firstName || user.first_name || 'Customer',
    lastName: user.lastName || user.last_name || 'User',
    email: user.email,
    role: user.role || 'customer',
  };
};

const splitName = (fullName = '') => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return { firstName: 'Customer', lastName: 'User' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || 'User',
  };
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('claude_user') || 'null'),
    token: localStorage.getItem('claude_jwt') || '',
    loading: false,
    error: '',
  }),
  actions: {
    setSession(user, token) {
      this.user = normalizeUser(user);
      this.token = token;
      localStorage.setItem('claude_user', JSON.stringify(this.user));
      localStorage.setItem('claude_jwt', token);
    },
    async hydrateUser() {
      if (!this.token) return null;

      try {
        const { data } = await api.get('/api/auth/me');
        if (data?.success && data?.data) {
          this.setSession(data.data, this.token);
          return this.user;
        }
      } catch (err) {
        if (err.response?.status === 401) this.logout();
        return null;
      }

      return this.user;
    },
    async register(payload) {
      this.loading = true;
      this.error = '';

      const nameParts = splitName(payload.name || payload.fullName || '');
      const safePayload = {
        ...payload,
        firstName: payload.firstName || nameParts.firstName,
        lastName: payload.lastName || nameParts.lastName,
      };

      try {
        const { data } = await api.post('/api/auth/register', safePayload);
        if (!data?.success || !data?.data?.token) throw new Error(data?.message || 'Registration failed');
        this.setSession(data.data.user, data.data.token);
        return data.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message || 'Registration failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async login(payload) {
      this.loading = true;
      this.error = '';

      try {
        const { data } = await api.post('/api/auth/login', payload);
        if (!data?.success || !data?.data?.token) throw new Error(data?.message || 'Login failed');
        this.setSession(data.data.user, data.data.token);
        return data.data;
      } catch (err) {
        this.error = err.response?.data?.message || err.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('claude_user');
      localStorage.removeItem('claude_jwt');
    },
  },
});

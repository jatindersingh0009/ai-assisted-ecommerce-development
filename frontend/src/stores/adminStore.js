import { defineStore } from 'pinia';
import api from '../services/api';

export const useAdminStore = defineStore('admin', {
  actions: {
    async fetchDashboard() {
      const { data } = await api.get('/api/admin/dashboard');
      return data?.data;
    },
    async fetchOrders() {
      const { data } = await api.get('/api/admin/orders', { params: { limit: 5 } });
      return data?.data || [];
    },
    async fetchAllOrders() {
      const { data } = await api.get('/api/admin/orders', { params: { limit: 50 } });
      return data?.data || [];
    },
    async updateOrderStatus(id, orderStatus) {
      const { data } = await api.patch(`/api/admin/orders/${id}/status`, { orderStatus });
      if (!data?.success) throw new Error(data?.message || 'Could not update order');
    },
    async fetchCustomers() {
      const { data } = await api.get('/api/admin/customers');
      return data?.data || [];
    },
    async fetchUsers() {
      const { data } = await api.get('/api/admin/users');
      return data?.data || [];
    },
    async createUser(user) {
      const { data } = await api.post('/api/admin/users', user);
      if (!data?.success) throw new Error(data?.message || 'Could not create user');
      return data.data;
    },
    async updateUser(id, user) {
      const { data } = await api.put(`/api/admin/users/${id}`, user);
      if (!data?.success) throw new Error(data?.message || 'Could not update user');
    },
    async deleteUser(id) {
      const { data } = await api.delete(`/api/admin/users/${id}`);
      if (!data?.success) throw new Error(data?.message || 'Could not delete user');
    },
    async setCustomerStatus(id, status) {
      const { data } = await api.patch(`/api/admin/customers/${id}/status`, { status });
      if (!data?.success) throw new Error(data?.message || 'Could not update customer status');
    },
    async fetchCategories() {
      const { data } = await api.get('/api/admin/categories');
      return data?.data || [];
    },
    async saveCategory(category) {
      const { data } = category.id
        ? await api.put(`/api/admin/categories/${category.id}`, category)
        : await api.post('/api/admin/categories', category);
      if (!data?.success) throw new Error(data?.message || 'Could not save category');
      return data.data;
    },
    async deleteCategory(id) {
      await api.delete(`/api/admin/categories/${id}`);
    },
    async fetchStoreSettings() {
      const { data } = await api.get('/api/admin/settings');
      return data?.data || {};
    },
    async updateStoreSettings(settings) {
      const { data } = await api.put('/api/admin/settings', settings);
      if (!data?.success) throw new Error(data?.message || 'Could not save store settings');
      return data.data;
    },
    async fetchPaymentCredentialStatus() {
      const { data } = await api.get('/api/admin/payment-gateways/credentials');
      return data?.data || {};
    },
    async savePaymentCredentials(credentials) {
      const { data } = await api.put('/api/admin/payment-gateways/credentials', credentials);
      if (!data?.success) throw new Error(data?.message || 'Could not save credentials');
      return data.data;
    },
    async testPaymentProvider(provider) {
      const { data } = await api.post(`/api/admin/payment-gateways/test/${provider}`);
      return data?.data;
    },
    async fetchSmtpStatus() {
      const { data } = await api.get('/api/admin/smtp');
      return data?.data || {};
    },
    async saveSmtp(settings) {
      const { data } = await api.put('/api/admin/smtp', settings);
      if (!data?.success) throw new Error(data?.message || 'Could not save SMTP settings');
      return data.data;
    },
    async testSmtp() {
      const { data } = await api.post('/api/admin/smtp/test');
      return data?.data;
    },
    async fetchContent(type) {
      const { data } = await api.get(`/api/admin/content/${type}`);
      return data?.data || [];
    },
    async saveContent(type, item) {
      const { data } = item.id
        ? await api.put(`/api/admin/content/${type}/${item.id}`, item)
        : await api.post(`/api/admin/content/${type}`, item);
      if (!data?.success) throw new Error(data?.message || 'Could not save content');
      return data.data;
    },
    async deleteContent(type, id) {
      await api.delete(`/api/admin/content/${type}/${id}`);
    },
    async fetchContentCategories() {
      const { data } = await api.get('/api/admin/content/taxonomy/categories');
      return data?.data || [];
    },
    async saveContentCategory(item) {
      const { data } = item.id
        ? await api.put(`/api/admin/content/taxonomy/categories/${item.id}`, item)
        : await api.post('/api/admin/content/taxonomy/categories', item);
      return data.data;
    },
    async deleteContentCategory(id) {
      await api.delete(`/api/admin/content/taxonomy/categories/${id}`);
    },
    async fetchContentTags() {
      const { data } = await api.get('/api/admin/content/taxonomy/tags');
      return data?.data || [];
    },
    async saveContentTag(item) {
      const { data } = item.id
        ? await api.put(`/api/admin/content/taxonomy/tags/${item.id}`, item)
        : await api.post('/api/admin/content/taxonomy/tags', item);
      return data.data;
    },
    async deleteContentTag(id) {
      await api.delete(`/api/admin/content/taxonomy/tags/${id}`);
    },
    async fetchPaymentGateways() {
      const { data } = await api.get('/api/admin/payment-gateways');
      return data?.data || {};
    },
    async updatePaymentGateways(settings) {
      const { data } = await api.put('/api/admin/payment-gateways', settings);
      if (!data?.success) throw new Error(data?.message || 'Unable to update payment gateways');
      return data.data;
    },
    async fetchProducts() {
      const { data } = await api.get('/api/admin/products');
      return (data?.data || []).map((product) => ({
        ...product,
        price: Number(product.price_cents || 0) / 100,
        stock: Number(product.stock_qty || 0),
      }));
    },
    async upsertProduct(product) {
      const payload = {
        ...product,
        price: Number(product.price || 0),
        stockQty: Number(product.stockQty ?? product.stock ?? 0),
        categoryId: product.categoryId ? Number(product.categoryId) : null,
        featured: Boolean(product.featured),
      };
      const { data } = product.id
        ? await api.put(`/api/products/${product.id}`, payload)
        : await api.post('/api/products', payload);
      if (!data?.success) throw new Error(data?.message || 'Unable to save product');
      return data.data;
    },
    async deleteProduct(id) {
      const { data } = await api.delete(`/api/products/${id}`);
      if (!data?.success) throw new Error(data?.message || 'Unable to delete product');
      return true;
    },
  },
});

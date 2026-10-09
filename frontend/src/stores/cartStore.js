import { defineStore } from 'pinia';
import api from '../services/api';

const centsToDollars = (value) => Number(value ?? 0) / 100;

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem('claude_cart') || '[]'),
    syncing: false,
    lastAdded: null,
    noticeTimer: null,
  }),
  getters: {
    count: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: (state) => state.items.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0),
  },
  actions: {
    persist() {
      localStorage.setItem('claude_cart', JSON.stringify(this.items));
    },
    normalizeItem(item) {
      return {
        id: item.id ?? item.product_id ?? item.productId,
        name: item.name || item.product_name || 'Product',
        slug: item.slug || '',
        price: Number(item.price ?? centsToDollars(item.price_cents ?? item.priceCents ?? 0)),
        image: item.image || item.product_image || '',
        quantity: Number(item.quantity ?? 1),
      };
    },
    async hydrateFromServer() {
      const token = localStorage.getItem('claude_jwt');
      if (!token) return this.items;

      try {
        this.syncing = true;
        const { data } = await api.get('/api/cart');
        const serverItems = Array.isArray(data?.data?.items) ? data.data.items : [];

        this.items = serverItems.map((item) => this.normalizeItem(item));
        this.persist();
        return this.items;
      } catch (err) {
        return this.items;
      } finally {
        this.syncing = false;
      }
    },
    async addItem(product, quantity = 1) {
      const quantityToAdd = Math.max(1, Math.min(10, Number(quantity) || 1));
      const localItem = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price || 0),
        image: product.image,
        quantity: quantityToAdd,
      };

      const existing = this.items.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity += quantityToAdd;
      } else {
        this.items.push(localItem);
      }
      this.persist();
      this.lastAdded = { name: product.name, image: product.image || '' };
      if (this.noticeTimer) clearTimeout(this.noticeTimer);
      this.noticeTimer = setTimeout(() => {
        this.lastAdded = null;
        this.noticeTimer = null;
      }, 3500);

      const token = localStorage.getItem('claude_jwt');
      if (!token) return localItem;

      try {
        await api.post('/api/cart/items', { productId: product.id, quantity: quantityToAdd });
        return await this.hydrateFromServer();
      } catch (err) {
        return localItem;
      }
    },
    async updateQuantity(productId, quantity) {
      const item = this.items.find((entry) => entry.id === productId);
      if (!item) return;
      item.quantity = Math.max(1, Number(quantity) || 1);
      this.persist();

      const token = localStorage.getItem('claude_jwt');
      if (!token) return;

      try {
        const cartItem = this.items.find((entry) => entry.id === productId);
        const backendItemId = cartItem?.backendId ?? productId;
        await api.put('/api/cart/items', { itemId: backendItemId, quantity: item.quantity });
      } catch (err) {
        console.warn('Cart sync failed');
      }
    },
    async removeItem(productId) {
      const cartItem = this.items.find((item) => item.id === productId);
      const backendItemId = cartItem?.backendId;

      this.items = this.items.filter((item) => item.id !== productId);
      this.persist();

      const token = localStorage.getItem('claude_jwt');
      if (!token || !backendItemId) return;

      try {
        await api.delete(`/api/cart/items/${backendItemId}`);
      } catch (err) {
        console.warn('Cart sync failed');
      }
    },
    clear() {
      this.items = [];
      this.persist();
    },
    dismissNotice() {
      if (this.noticeTimer) clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
      this.lastAdded = null;
    },
  },
});

import { defineStore } from 'pinia';
import api from '../services/api';

export const useOrderStore = defineStore('order', {
  actions: {
    async calculateTotals(items, paymentMethod = 'cod') {
      try {
        const normalized = items.map((item) => ({
          productId: item.id,
          productName: item.name,
          sku: item.sku || '',
          priceCents: Math.round(Number(item.price || 0) * 100),
          quantity: Number(item.quantity || 1),
          stockQty: Number(item.stock || 99),
        }));

        const { data } = await api.post('/api/checkout/totals', {
          items: normalized,
          paymentMethod,
          shippingCostCents: 1000,
          taxRate: 0.08,
        });

        if (data?.success) {
          return data.data;
        }
      } catch (err) {
        console.warn('Checkout totals API unavailable', err);
      }

      return {
        subtotalCents: items.reduce((sum, item) => sum + Math.round(Number(item.price || 0) * 100 * Number(item.quantity || 1)), 0),
        shippingCostCents: 1000,
        taxCents: Math.round((items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0) * 0.08) * 100) / 100,
        codFeeCents: paymentMethod === 'cod' ? 1000 : 0,
        grandTotalCents: items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0) * 1.08 + 10 + (paymentMethod === 'cod' ? 10 : 0),
      };
    },
    async createOrder(payload) {
      const { data } = await api.post('/api/orders', payload);
      if (!data?.success) throw new Error(data?.message || 'Unable to save your order');
      return data.data;
    },
    async createPaymentSession(paymentMethod, amountCents, orderId) {
      try {
        if (paymentMethod === 'stripe') {
          const { data } = await api.post('/api/payments/stripe/create-intent', {
            amountCents,
            currency: 'USD',
            orderId,
          });
          return data?.data || data;
        }

        if (paymentMethod === 'paypal') {
          const { data } = await api.post('/api/payments/paypal/create-order', {
            amountCents,
            currency: 'USD',
            orderId,
          });
          return data?.data || data;
        }

        return { status: 'cod' };
      } catch (err) {
        throw new Error(err.response?.data?.message || 'Unable to create payment session');
      }
    },
    async fetchOrderById(id) {
      const { data } = await api.get(`/api/orders/${id}`);
      return data?.data || null;
    },
  },
});

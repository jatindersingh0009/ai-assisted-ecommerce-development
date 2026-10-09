<template>
  <div class="page-shell">
    <div class="header-row">
      <div>
        <p class="eyebrow">Order details</p>
        <h1>#{{ order.id }}</h1>
      </div>
      <span class="badge" :class="order.status.toLowerCase()">{{ order.status }}</span>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Items</h3>
        <div v-for="item in order.items" :key="item.id" class="item-row">
          <div>
            <strong>{{ item.name }}</strong>
            <span>{{ item.quantity }} × {{ formatCurrency(item.price) }}</span>
          </div>
          <strong>{{ formatCurrency(item.quantity * item.price) }}</strong>
        </div>
      </div>

      <div class="card summary">
        <h3>Summary</h3>
        <div class="row"><span>Subtotal</span><strong>{{ formatCurrency(order.subtotal) }}</strong></div>
        <div class="row"><span>Shipping</span><strong>{{ formatCurrency(order.shipping) }}</strong></div>
        <div class="row"><span>Tax</span><strong>{{ formatCurrency(order.tax) }}</strong></div>
        <div class="row total"><span>Total</span><strong>{{ formatCurrency(order.total) }}</strong></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '../stores/orderStore';

const route = useRoute();
const orderStore = useOrderStore();
const order = ref({
  id: route.params.id || '10012',
  status: 'Paid',
  subtotal: 299.99,
  shipping: 12.0,
  tax: 24.0,
  total: 335.99,
  items: [
    { id: 1, name: 'Modern Lounge Chair', quantity: 1, price: 219.99 },
    { id: 2, name: 'Minimal Floor Lamp', quantity: 1, price: 109.99 },
  ],
});

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

onMounted(async () => {
  const fetched = await orderStore.fetchOrderById(route.params.id || '10012');
  if (fetched) {
    order.value = {
      ...fetched,
      subtotal: (fetched.subtotal ?? fetched.total ?? 335.99) - (fetched.shipping ?? 12) - (fetched.tax ?? 24),
      shipping: fetched.shipping ?? 12,
      tax: fetched.tax ?? 24,
      total: fetched.total ?? 335.99,
      items: fetched.items ?? order.value.items,
    };
  }
});
</script>

<style scoped>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 800;
}
.header-row h1 {
  margin: 0.4rem 0 0;
  font-size: clamp(2rem, 4vw, 3rem);
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  font-weight: 700;
}
.badge.paid {
  background: #dcfce7;
  color: #166534;
}
.grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.2rem;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 1.2rem;
}
.card h3 {
  margin-top: 0;
}
.item-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.item-row div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.row.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 1.1rem;
}
@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

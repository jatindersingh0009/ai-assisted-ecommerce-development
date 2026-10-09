<template>
  <div class="page-shell">
    <AdminNav />
    <div class="header-row">
      <div>
        <p class="eyebrow">Admin dashboard</p>
        <h1>Operations overview</h1>
      </div>
      <button class="primary">Export report</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>Revenue</span>
        <strong>{{ formatCurrency(stats.totalSales) }}</strong>
      </div>
      <div class="stat-card">
        <span>Orders</span>
        <strong>{{ stats.totalOrders.toLocaleString() }}</strong>
      </div>
      <div class="stat-card">
        <span>Pending orders</span>
        <strong>{{ stats.pendingOrders.toLocaleString() }}</strong>
      </div>
      <div class="stat-card">
        <span>Customers</span>
        <strong>{{ stats.totalCustomers.toLocaleString() }}</strong>
      </div>
    </div>

    <div class="quick-links">
      <router-link :to="adminRoute('products')" class="secondary">Manage products</router-link>
      <span class="secondary">{{ stats.totalProducts }} products</span>
    </div>

    <section class="card gateway-settings">
      <div class="gateway-heading">
        <div>
          <h3>Payment gateways</h3>
          <p>Choose which payment methods customers can use at checkout.</p>
        </div>
        <span v-if="gatewayMessage" class="saved-message" role="status">{{ gatewayMessage }}</span>
      </div>
      <div class="gateway-list">
        <label v-for="gateway in gatewayOptions" :key="gateway.key" class="gateway-row">
          <span><strong>{{ gateway.label }}</strong><small>{{ gateway.description }}</small></span>
          <input
            v-model="gatewaySettings[gateway.key]"
            type="checkbox"
            :aria-label="`${gateway.label} enabled`"
            :disabled="gatewaySaving || !canEditGateways"
            @change="saveGateway(gateway.key)"
          />
        </label>
      </div>
      <p v-if="gatewayError" class="gateway-error" role="alert">{{ gatewayError }}</p>
    </section>

    <div class="content-grid">
      <div class="card">
        <h3>Recent orders</h3>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>#{{ order.order_number }}</td>
              <td>{{ order.first_name }} {{ order.last_name }}</td>
              <td>{{ formatCurrency(order.grand_total_cents / 100) }}</td>
              <td><span class="status" :class="order.order_status">{{ order.order_status }}</span></td>
            </tr>
            <tr v-if="!orders.length"><td colspan="4">No orders have been placed yet.</td></tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import AdminNav from '../components/AdminNav.vue';
import { useAuthStore } from '../stores/authStore';
import { adminRoute } from '../config/adminPath';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const canEditGateways = authStore.user?.role === 'super_admin' || authStore.user?.permissions?.['payment_gateways.edit'] === true;
const orders = ref([]);
const gatewayOptions = [
  { key: 'stripe', label: 'Stripe', description: 'Card payments' },
  { key: 'paypal', label: 'PayPal', description: 'PayPal checkout' },
  { key: 'cod', label: 'Cash on delivery', description: 'Pay when the order arrives' },
];
const gatewaySettings = ref({ stripe: false, paypal: false, cod: false });
const gatewaySaving = ref(false);
const gatewayError = ref('');
const gatewayMessage = ref('');

const stats = ref({
  totalSales: '0.00',
  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
});

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

onMounted(async () => {
  try {
    const [dashboard, latestOrders, paymentGateways] = await Promise.all([
      adminStore.fetchDashboard(),
      adminStore.fetchOrders(),
      adminStore.fetchPaymentGateways(),
    ]);
    if (dashboard) stats.value = { ...stats.value, ...dashboard };
    orders.value = latestOrders;
    gatewaySettings.value = { ...gatewaySettings.value, ...paymentGateways };
  } catch (error) {
    console.error('Could not load admin overview', error);
  }
});

const saveGateway = async (key) => {
  gatewaySaving.value = true;
  gatewayError.value = '';
  gatewayMessage.value = '';
  try {
    gatewaySettings.value = await adminStore.updatePaymentGateways({ [key]: gatewaySettings.value[key] });
    gatewayMessage.value = 'Gateway settings saved';
  } catch (error) {
    gatewaySettings.value[key] = !gatewaySettings.value[key];
    gatewayError.value = error.response?.data?.message || error.message || 'Could not save gateway settings.';
  } finally {
    gatewaySaving.value = false;
  }
};
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
.primary {
  border: none;
  border-radius: 999px;
  background: #111827;
  color: white;
  padding: 0.85rem 1.2rem;
  font-weight: 700;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card,
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1.2rem;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.stat-card span {
  color: #6b7280;
}
.stat-card strong {
  font-size: 1.8rem;
}
.quick-links {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1rem;
  border-radius: 999px;
  background: white;
  color: #111827;
  border: 1px solid #d1d5db;
  text-decoration: none;
  font-weight: 700;
}
.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr;
  gap: 1.2rem;
}
.card h3 {
  margin-top: 0;
}
.gateway-settings { margin-bottom: 1.5rem; }
.gateway-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.gateway-heading h3 { margin: 0 0 0.35rem; }
.gateway-heading p, .gateway-row small { color: #6b7280; margin: 0; }
.gateway-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; margin-top: 1rem; }
.gateway-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.9rem; border: 1px solid #e5e7eb; border-radius: 6px; }
.gateway-row span { display: grid; gap: 0.25rem; }
.gateway-row input { width: 1.15rem; height: 1.15rem; accent-color: #15803d; }
.saved-message { color: #166534; font-size: 0.9rem; }
.gateway-error { color: #b42318; margin-bottom: 0; }
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  text-align: left;
  padding: 0.8rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}
.status {
  display: inline-flex;
  padding: 0.32rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}
.status.paid {
  background: #dcfce7;
  color: #166534;
}
.status.pending {
  background: #fef3c7;
  color: #92400e;
}
.status.shipped {
  background: #dbeafe;
  color: #1d4ed8;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid #f3f4f6;
}
@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .gateway-list { grid-template-columns: 1fr; }
}
</style>

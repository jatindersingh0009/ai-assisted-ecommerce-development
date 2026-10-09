<template>
  <div class="page-shell">
    <AdminNav />
    <header class="page-header"><div><p class="eyebrow">Fulfillment</p><h1>Orders</h1></div><span>{{ orders.length }} latest orders</span></header>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Email</th><th>Total</th><th>Payment</th><th>Order status</th></tr></thead><tbody>
      <tr v-for="order in orders" :key="order.id"><td>#{{ order.order_number }}</td><td>{{ order.first_name }} {{ order.last_name }}</td><td>{{ order.email }}</td><td>{{ money(order.grand_total_cents / 100) }}</td><td>{{ order.payment_method }} / {{ order.payment_status }}</td><td><select v-if="can('orders.edit')" v-model="order.order_status" @change="saveStatus(order)"><option v-for="status in statuses" :key="status" :value="status">{{ status }}</option></select><span v-else>{{ order.order_status }}</span></td></tr>
      <tr v-if="!orders.length"><td colspan="6">No orders found.</td></tr>
    </tbody></table></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import AdminNav from '../components/AdminNav.vue';
import { useAdminStore } from '../stores/adminStore';
import { useAuthStore } from '../stores/authStore';
const store = useAdminStore();
const auth = useAuthStore();
const can = (permission) => auth.user?.role === 'super_admin' || auth.user?.permissions?.[permission] === true;
const orders = ref([]);
const error = ref('');
const statuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];
const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
const load = async () => { try { orders.value = await store.fetchAllOrders(); } catch (err) { error.value = err.response?.data?.message || 'Could not load orders.'; } };
const saveStatus = async (order) => { try { await store.updateOrderStatus(order.id, order.order_status); error.value = ''; } catch (err) { error.value = err.response?.data?.message || 'Could not update order.'; await load(); } };
onMounted(load);
</script>

<style scoped>
.page-shell { max-width: 1200px; margin: auto; padding: 2rem 1.25rem 4rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.eyebrow { margin: 0; color: #27634d; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; }
h1 { margin: 0.35rem 0 0; }.table-wrap { overflow-x: auto; padding: 1rem; background: #fff; border: 1px solid #d8dedb; border-radius: 7px; }
table { width: 100%; border-collapse: collapse; } th,td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #edf0ee; white-space: nowrap; }
select { padding: 0.55rem; border: 1px solid #bcc7c1; border-radius: 4px; text-transform: capitalize; }.error { color: #b42318; }
</style>
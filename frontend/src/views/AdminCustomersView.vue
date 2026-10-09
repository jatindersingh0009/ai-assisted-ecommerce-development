<template>
  <div class="page-shell">
    <AdminNav />
    <header class="page-header"><div><p class="eyebrow">Accounts</p><h1>Customers</h1></div><span>{{ customers.length }} customers</span></header>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th><th>Access</th></tr></thead><tbody>
      <tr v-for="customer in customers" :key="customer.id"><td>{{ customer.first_name }} {{ customer.last_name }}</td><td>{{ customer.email }}</td><td>{{ customer.status }}</td><td>{{ new Date(customer.created_at).toLocaleDateString() }}</td><td><button v-if="can('customers.edit')" @click="toggleCustomer(customer)">{{ customer.status === 'active' ? 'Disable' : 'Enable' }}</button></td></tr>
      <tr v-if="!customers.length"><td colspan="5">No customers found.</td></tr>
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
const customers = ref([]);
const error = ref('');
const load = async () => { try { customers.value = await store.fetchCustomers(); } catch (err) { error.value = err.response?.data?.message || 'Could not load customers.'; } };
const toggleCustomer = async (customer) => { try { await store.setCustomerStatus(customer.id, customer.status === 'active' ? 'disabled' : 'active'); await load(); } catch (err) { error.value = err.response?.data?.message || 'Could not update customer.'; } };
onMounted(load);
</script>

<style scoped>
.page-shell { max-width: 1200px; margin: auto; padding: 2rem 1.25rem 4rem; }.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.eyebrow { margin: 0; color: #27634d; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; } h1 { margin: 0.35rem 0 0; }
.table-wrap { overflow-x: auto; padding: 1rem; background: #fff; border: 1px solid #d8dedb; border-radius: 7px; } table { width: 100%; border-collapse: collapse; } th,td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #edf0ee; }.error { color: #b42318; }
</style>
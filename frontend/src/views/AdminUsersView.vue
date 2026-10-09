<template>
  <div class="page-shell">
    <AdminNav />
    <header class="page-header"><div><p class="eyebrow">Access control</p><h1>Users & roles</h1></div><button v-if="isSuperAdmin || auth.user?.permissions?.['users.create']" class="primary" @click="newUser">Add user</button></header>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form v-if="editing" class="editor" @submit.prevent="save">
      <h2>{{ form.id ? 'Edit user' : 'Create user' }}</h2>
      <div class="form-grid"><label>First name<input v-model="form.firstName" required /></label><label>Last name<input v-model="form.lastName" required /></label><label>Email<input v-model="form.email" type="email" required /></label><label v-if="!form.id">Temporary password<input v-model="form.password" type="password" minlength="8" required /></label>
        <label>Role<select v-model="form.role" :disabled="!isSuperAdmin"><option value="customer">Customer</option><option value="admin">Admin</option><option v-if="isSuperAdmin" value="super_admin">Super admin</option></select></label>
        <label v-if="form.id">Status<select v-model="form.status"><option value="active">Enabled</option><option value="disabled">Disabled</option><option value="pending">Pending</option></select></label>
      </div>
      <fieldset v-if="form.role === 'admin'"><legend>Admin permissions</legend><div v-for="group in permissionGroups" :key="group.label" class="permission-group"><strong>{{ group.label }}</strong><label v-for="permission in group.permissions" :key="permission"><input v-model="form.permissions[permission]" type="checkbox" />{{ permission.split('.')[1] }}</label></div></fieldset>
      <div class="actions"><button class="primary">Save user</button><button type="button" @click="editing = false">Cancel</button></div>
    </form>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      <tr v-for="user in users" :key="user.id"><td>{{ user.first_name }} {{ user.last_name }}</td><td>{{ user.email }}</td><td>{{ user.role }}</td><td>{{ user.status }}</td><td><button v-if="isSuperAdmin || (user.role === 'customer' && auth.user?.permissions?.['users.edit'])" @click="edit(user)">Edit / permissions</button><button v-if="user.role === 'customer' && (isSuperAdmin || auth.user?.permissions?.['customers.edit'])" @click="toggleCustomer(user)">{{ user.status === 'active' ? 'Disable' : 'Enable' }}</button><button v-if="user.id !== auth.user?.id && (user.role === 'customer' || isSuperAdmin) && (isSuperAdmin || auth.user?.permissions?.['users.delete'])" @click="removeUser(user)">Delete</button></td></tr>
      <tr v-if="!users.length"><td colspan="5">No users found.</td></tr>
    </tbody></table></div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AdminNav from '../components/AdminNav.vue';
import { useAuthStore } from '../stores/authStore';
import { useAdminStore } from '../stores/adminStore';
const auth = useAuthStore(); const store = useAdminStore();
const isSuperAdmin = computed(() => auth.user?.role === 'super_admin');
const users = ref([]); const editing = ref(false); const error = ref('');
const permissionGroups = [
  { label: 'Dashboard', permissions: ['dashboard.view'] },
  { label: 'Products', permissions: ['products.view', 'products.create', 'products.edit', 'products.delete'] },
  { label: 'Categories', permissions: ['categories.view', 'categories.create', 'categories.edit', 'categories.delete'] },
  { label: 'Orders', permissions: ['orders.view', 'orders.edit'] },
  { label: 'Customers', permissions: ['customers.view', 'customers.create', 'customers.edit', 'customers.delete'] },
  { label: 'Users', permissions: ['users.view', 'users.create', 'users.edit', 'users.delete'] },
  { label: 'Settings and payments', permissions: ['settings.view', 'settings.edit', 'payment_gateways.view', 'payment_gateways.edit'] },
  { label: 'Pages and posts', permissions: ['content.view', 'content.create', 'content.edit', 'content.delete'] },
];
const blank = () => ({ id: null, firstName: '', lastName: '', email: '', password: '', role: 'customer', status: 'active', permissions: {} });
const form = reactive(blank());
const load = async () => { try { users.value = await store.fetchUsers(); } catch (err) { error.value = err.response?.data?.message || 'Could not load users.'; } };
const newUser = () => { Object.assign(form, blank()); editing.value = true; };
const edit = (user) => { Object.assign(form, { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, password: '', role: user.role, status: user.status, permissions: { ...user.permissions } }); editing.value = true; };
const save = async () => {
  error.value = '';
  const payload = { ...form, permissions: form.role === 'admin' ? { ...form.permissions } : {} };
  try {
    if (form.id) await store.updateUser(form.id, payload);
    else await store.createUser(payload);
    editing.value = false; await load();
  } catch (err) { error.value = err.response?.data?.message || err.message || 'Could not save user.'; }
};
const toggleCustomer = async (user) => { try { await store.setCustomerStatus(user.id, user.status === 'active' ? 'disabled' : 'active'); await load(); } catch (err) { error.value = err.response?.data?.message || 'Could not update customer.'; } };
const removeUser = async (user) => { if (!window.confirm(`Delete ${user.email}? Accounts with order history must be disabled instead.`)) return; try { await store.deleteUser(user.id); await load(); } catch (err) { error.value = err.response?.data?.message || 'Could not delete user.'; } };
onMounted(load);
</script>

<style scoped>
.page-shell { max-width: 1200px; margin: auto; padding: 2rem 1.25rem 4rem; }.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }.eyebrow { margin: 0; color: #27634d; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; }h1 { margin: 0.35rem 0 0; }
.editor,.table-wrap { padding: 1rem; background: #fff; border: 1px solid #d8dedb; border-radius: 7px; margin-bottom: 1rem; }.editor { display: grid; gap: 1rem; }.editor h2 { margin: 0; font-size: 1.15rem; }.form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0.8rem; }label { display: flex; align-items: center; gap: 0.45rem; } .form-grid label { display: grid; } input:not([type=checkbox]),select { box-sizing: border-box; width: 100%; padding: 0.65rem; border: 1px solid #bcc7c1; border-radius: 4px; }
fieldset { display: grid; gap: 0.8rem; border: 1px solid #d8dedb; border-radius: 5px; }.permission-group { display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: center; }.permission-group strong { width: 100%; }.permission-group label { text-transform: capitalize; }.actions { display: flex; gap: 0.6rem; }.primary { padding: 0.7rem 0.9rem; border: 0; border-radius: 5px; background: #1d5a46; color: white; font-weight: 700; cursor: pointer; }
table { width: 100%; border-collapse: collapse; } th,td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #edf0ee; }td button { margin-right: 0.5rem; }.error { color: #b42318; }
@media(max-width:700px){.form-grid{grid-template-columns:1fr}.table-wrap{overflow-x:auto}}
</style>
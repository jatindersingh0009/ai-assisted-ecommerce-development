<template>
  <div class="page-shell">
    <section class="page-header">
      <div>
        <p class="eyebrow">My account</p>
        <h1>{{ user?.firstName || 'Customer' }} {{ user?.lastName || '' }}</h1>
      </div>
      <button class="secondary" @click="logout">Log out</button>
    </section>

    <div class="grid">
      <div class="card profile-card">
        <h3>Profile</h3>
        <form class="account-form" @submit.prevent="saveProfile">
          <label>First name<input v-model="profile.firstName" required /></label>
          <label>Last name<input v-model="profile.lastName" required /></label>
          <label>Email<input v-model="profile.email" type="email" required /></label>
          <p v-if="profileMessage" class="success" role="status">{{ profileMessage }}</p>
          <p v-if="profileError" class="error" role="alert">{{ profileError }}</p>
          <button type="submit" :disabled="profileSaving">Save profile</button>
        </form>
        <ul>
          <li><span>Role</span><strong>{{ user?.role || 'customer' }}</strong></li>
          <li><span>Member since</span><strong>2026</strong></li>
        </ul>
      </div>

      <div class="card password-card">
        <h3>Change password</h3>
        <form class="account-form" @submit.prevent="changePassword">
          <label>Current password<input v-model="passwordForm.currentPassword" type="password" required autocomplete="current-password" /></label>
          <label>New password<input v-model="passwordForm.newPassword" type="password" minlength="8" required autocomplete="new-password" /></label>
          <label>Confirm new password<input v-model="passwordForm.confirmPassword" type="password" minlength="8" required autocomplete="new-password" /></label>
          <p v-if="passwordMessage" class="success" role="status">{{ passwordMessage }}</p>
          <p v-if="passwordError" class="error" role="alert">{{ passwordError }}</p>
          <button type="submit" :disabled="passwordSaving">Update password</button>
        </form>
      </div>

      <div class="card order-card">
        <h3>Recent orders</h3>
        <div class="order-item" v-for="order in orders" :key="order.id">
          <div>
            <strong>#{{ order.orderNumber }}</strong>
            <span>{{ order.orderStatus }}</span>
          </div>
          <div class="order-actions">
            <span>{{ formatCurrency(order.grandTotalCents / 100) }}</span>
            <router-link :to="`/orders/${order.id}`" class="small-link">View</router-link>
          </div>
        </div>
        <p v-if="!orders.length">No orders yet.</p>
      </div>
    </div>

    <div class="card addresses-card">
      <div class="address-heading"><h3>Saved addresses</h3><button class="address-action" @click="newAddress">Add address</button></div>
      <form v-if="addressEditorOpen" class="account-form address-form" @submit.prevent="saveAddress">
        <div class="address-form-grid">
          <label>Address type<select v-model="addressForm.type"><option value="billing">Billing</option><option value="shipping">Shipping</option></select></label>
          <label class="default-choice"><input v-model="addressForm.isDefault" type="checkbox" /> Default for this type</label>
          <label>First name<input v-model="addressForm.firstName" required /></label>
          <label>Last name<input v-model="addressForm.lastName" required /></label>
          <label class="wide">Street address<input v-model="addressForm.address" required /></label>
          <label class="wide">Address line 2<input v-model="addressForm.address2" /></label>
          <label>City<input v-model="addressForm.city" required /></label>
          <label>State / region<input v-model="addressForm.state" /></label>
          <label>Postal code<input v-model="addressForm.zip" required /></label>
          <label>Country<input v-model="addressForm.country" required /></label>
          <label>Phone<input v-model="addressForm.phone" type="tel" /></label>
        </div>
        <p v-if="addressError" class="error" role="alert">{{ addressError }}</p>
        <div class="address-form-actions"><button type="submit" :disabled="addressSaving">{{ addressForm.id ? 'Save address' : 'Add address' }}</button><button type="button" class="cancel-address" @click="addressEditorOpen = false">Cancel</button></div>
      </form>
      <div class="address-grid">
        <div v-for="address in addresses" :key="address.id" class="address-box">
          <strong>{{ address.type }} address<span v-if="address.isDefault"> · Default</span></strong>
          <p>{{ address.firstName }} {{ address.lastName }}</p>
          <p>{{ address.address }}</p>
          <p v-if="address.address2">{{ address.address2 }}</p>
          <p>{{ address.city }}<span v-if="address.state">, {{ address.state }}</span> {{ address.zip }}</p>
          <p>{{ address.country }}<span v-if="address.phone"> · {{ address.phone }}</span></p>
          <div class="address-form-actions"><button type="button" @click="editAddress(address)">Edit</button><button type="button" class="delete-address" @click="deleteAddress(address)">Delete</button></div>
        </div>
      </div>
      <p v-if="!addresses.length && !addressEditorOpen">No saved addresses. Add one to select it at checkout.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const authStore = useAuthStore();
const router = useRouter();
const user = computed(() => authStore.user);
const profile = reactive({ firstName: authStore.user?.firstName || '', lastName: authStore.user?.lastName || '', email: authStore.user?.email || '' });
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const profileMessage = ref('');
const profileError = ref('');
const profileSaving = ref(false);
const passwordMessage = ref('');
const passwordError = ref('');
const passwordSaving = ref(false);

const orders = ref([]);
const addresses = ref([]);
const addressEditorOpen = ref(false);
const addressSaving = ref(false);
const addressError = ref('');
const emptyAddress = () => ({ id: null, type: 'shipping', firstName: user.value?.firstName || '', lastName: user.value?.lastName || '', address: '', address2: '', city: '', state: '', zip: '', country: 'US', phone: '', isDefault: false });
const addressForm = reactive(emptyAddress());

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const saveProfile = async () => {
  profileSaving.value = true;
  profileError.value = '';
  profileMessage.value = '';
  try {
    const { data } = await api.put('/api/auth/me', profile);
    authStore.setSession(data.data, authStore.token);
    profileMessage.value = 'Profile saved.';
  } catch (error) {
    profileError.value = error.response?.data?.message || 'Could not save your profile.';
  } finally {
    profileSaving.value = false;
  }
};

const changePassword = async () => {
  passwordError.value = '';
  passwordMessage.value = '';
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'New passwords do not match.';
    return;
  }
  passwordSaving.value = true;
  try {
    const { data } = await api.put('/api/auth/password', passwordForm);
    passwordMessage.value = data.message;
    Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '' });
  } catch (error) {
    passwordError.value = error.response?.data?.message || 'Could not update your password.';
  } finally {
    passwordSaving.value = false;
  }
};

const newAddress = () => {
  Object.assign(addressForm, emptyAddress());
  addressError.value = '';
  addressEditorOpen.value = true;
};

const editAddress = (address) => {
  Object.assign(addressForm, { ...emptyAddress(), ...address, isDefault: Boolean(address.isDefault) });
  addressError.value = '';
  addressEditorOpen.value = true;
};

const reloadAddresses = async () => {
  const { data } = await api.get('/api/orders/addresses');
  addresses.value = data?.data || [];
};

const saveAddress = async () => {
  addressSaving.value = true;
  addressError.value = '';
  try {
    if (addressForm.id) await api.put(`/api/orders/addresses/${addressForm.id}`, addressForm);
    else await api.post('/api/orders/addresses', addressForm);
    await reloadAddresses();
    addressEditorOpen.value = false;
  } catch (error) {
    addressError.value = error.response?.data?.message || 'Could not save address.';
  } finally {
    addressSaving.value = false;
  }
};

const deleteAddress = async (address) => {
  if (!window.confirm(`Delete this ${address.type} address?`)) return;
  try {
    await api.delete(`/api/orders/addresses/${address.id}`);
    await reloadAddresses();
    addressError.value = '';
  } catch (error) {
    addressError.value = error.response?.data?.message || 'Could not delete address.';
  }
};

onMounted(async () => {
  try {
    const [ordersResponse] = await Promise.all([api.get('/api/orders')]);
    orders.value = ordersResponse.data?.data || [];
    await reloadAddresses();
  } catch (error) {
    console.error('Could not load account history', error);
  }
});

const logout = () => {
  authStore.logout();
  router.replace('/');
};
</script>

<style scoped>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.page-header {
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
.page-header h1 {
  margin: 0.4rem 0 0;
  font-size: clamp(2rem, 4vw, 3rem);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 1.2rem;
}
.card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}
.account-form { display: grid; gap: 0.7rem; margin-bottom: 1rem; }
.account-form label { display: grid; gap: 0.35rem; font-weight: 600; }
.account-form input { width: 100%; box-sizing: border-box; padding: 0.65rem; border: 1px solid #c4cec8; border-radius: 5px; }
.account-form button { justify-self: start; border: 0; border-radius: 5px; background: #1d5a46; color: #fff; padding: 0.7rem 0.9rem; font-weight: 700; cursor: pointer; }
.success { color: #166534; margin: 0; }
.error { color: #b42318; margin: 0; }
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
li:last-child {
  border-bottom: none;
}
.order-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.order-item div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.order-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.small-link {
  color: #4f46e5;
  font-weight: 700;
  text-decoration: none;
}
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
.address-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.address-heading h3 { margin: 0 0 1rem; }
.address-form { padding: 1rem; border: 1px solid #d8dedb; border-radius: 7px; margin-bottom: 1rem; }
.address-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.address-form-grid .wide { grid-column: 1 / -1; }
.address-form-grid .default-choice { display: flex; align-items: center; }
.address-form-grid .default-choice input { width: auto; }
.address-form-actions { display: flex; gap: 0.55rem; margin-top: 0.7rem; }
.address-form-actions button, .address-action { border: 0; border-radius: 5px; padding: 0.6rem 0.8rem; background: #1d5a46; color: #fff; font-weight: 700; cursor: pointer; }
.address-form-actions .delete-address, .address-form-actions .cancel-address { color: #374151; background: #fff; border: 1px solid #d1d5db; }
.address-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1rem;
}
.address-box p {
  margin: 0.35rem 0 0;
  color: #4b5563;
}
.secondary {
  border: 1px solid #d1d5db;
  background: white;
  color: #111827;
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 700;
  cursor: pointer;
}
@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .address-form-grid { grid-template-columns: 1fr; }
  .address-form-grid .wide { grid-column: auto; }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

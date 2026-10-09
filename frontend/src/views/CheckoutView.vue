<template>
  <div class="page-shell">
    <h1>Checkout</h1>

    <div class="checkout-grid">
      <form class="form-card" @submit.prevent="submitOrder">
        <section>
          <h3>Billing information</h3>
          <label v-if="savedAddresses.length">Saved billing address
            <select v-model="billingAddressId" @change="selectBillingAddress">
              <option value="">Enter billing address</option>
              <option v-for="address in savedAddresses" :key="address.id" :value="String(address.id)">{{ addressLabel(address) }}</option>
            </select>
          </label>
          <div class="two-col">
            <label>First name<input v-model="billing.firstName" required :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
            <label>Last name<input v-model="billing.lastName" required :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
          </div>
          <label>Email<input v-model="billing.email" type="email" required /></label>
          <label>Street address<input v-model="billing.address" required :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
          <label>Address line 2<input v-model="billing.address2" :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
          <div class="two-col">
            <label>City<input v-model="billing.city" required :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
            <label>State / region<input v-model="billing.state" :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
          </div>
          <div class="two-col">
            <label>Postal code<input v-model="billing.zip" required :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
            <label>Country<input v-model="billing.country" required :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
          </div>
          <label>Phone<input v-model="billing.phone" type="tel" :readonly="Boolean(billingAddressId)" @input="billingAddressId = ''" /></label>
        </section>

        <section class="shipping-section">
          <label class="shipping-toggle"><input v-model="differentShipping" type="checkbox" @change="toggleShippingAddress" /> Ship to a different address</label>
          <template v-if="differentShipping">
            <h3>Shipping information</h3>
            <label v-if="savedAddresses.length">Saved shipping address
              <select v-model="shippingAddressId" @change="selectShippingAddress">
                <option value="">Enter a different shipping address</option>
                <option v-for="address in savedAddresses" :key="address.id" :value="String(address.id)">{{ addressLabel(address) }}</option>
              </select>
            </label>
            <div class="two-col">
              <label>First name<input v-model="shipping.firstName" required :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
              <label>Last name<input v-model="shipping.lastName" required :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
            </div>
            <label>Street address<input v-model="shipping.address" required :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
            <label>Address line 2<input v-model="shipping.address2" :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
            <div class="two-col">
              <label>City<input v-model="shipping.city" required :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
              <label>State / region<input v-model="shipping.state" :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
            </div>
            <div class="two-col">
              <label>Postal code<input v-model="shipping.zip" required :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
              <label>Country<input v-model="shipping.country" required :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
            </div>
            <label>Phone<input v-model="shipping.phone" type="tel" :readonly="Boolean(shippingAddressId)" @input="shippingAddressId = ''" /></label>
          </template>
          <p v-else class="address-note">Shipping address will match your billing address.</p>
        </section>

        <section>
          <h3>Payment</h3>
          <label>
            Payment method
            <select v-model="form.paymentMethod" required>
              <option v-for="method in paymentMethods" :key="method.key" :value="method.key">{{ method.label }}</option>
            </select>
          </label>

          <template v-if="form.paymentMethod === 'stripe'">
            <label>
              Cardholder name
              <input v-model="form.cardName" required />
            </label>
            <label>
              Card number
              <input v-model="form.cardNumber" required />
            </label>
          </template>
        </section>

        <button type="submit" class="primary" :disabled="!paymentMethods.length">Place order</button>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="!paymentMethods.length" class="error" role="alert">No payment methods are currently available. Please contact the store.</p>
        <p v-if="!authStore.user">Please <router-link to="/login">sign in</router-link> before placing an order.</p>
      </form>

      <aside class="summary">
        <h3>Order summary</h3>
        <div v-for="item in items" :key="item.id" class="summary-item">
          <span>{{ item.name }} × {{ item.quantity }}</span>
          <strong>{{ formatCurrency(item.price * item.quantity) }}</strong>
        </div>
        <div class="row">
          <span>Subtotal</span>
          <strong>{{ formatCurrency(subtotal) }}</strong>
        </div>
        <div class="row">
          <span>Shipping</span>
          <strong>{{ formatCurrency(10) }}</strong>
        </div>
        <div class="row total">
          <span>Total</span>
          <strong>{{ formatCurrency(subtotal + 10) }}</strong>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cartStore';
import { useOrderStore } from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const router = useRouter();
const cartStore = useCartStore();
const orderStore = useOrderStore();
const authStore = useAuthStore();
const items = computed(() => cartStore.items);
const subtotal = computed(() => cartStore.subtotal);
const error = ref('');
const paymentMethods = ref([]);
const savedAddresses = ref([]);
const billingAddressId = ref('');
const shippingAddressId = ref('');
const differentShipping = ref(false);
const methodLabels = { cod: 'Cash on delivery', stripe: 'Stripe', paypal: 'PayPal' };

const billing = reactive({
  firstName: authStore.user?.firstName || '',
  lastName: authStore.user?.lastName || '',
  email: authStore.user?.email || '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
});
const shipping = reactive({
  firstName: authStore.user?.firstName || '',
  lastName: authStore.user?.lastName || '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
});
const form = reactive({
  cardName: '',
  cardNumber: '',
  paymentMethod: 'cod',
});

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
const addressLabel = (address) => `${address.firstName} ${address.lastName}, ${address.address}, ${address.city} ${address.zip}${address.isDefault ? ' (Default)' : ''}`;

const applyAddress = (target, address) => {
  Object.assign(target, {
    firstName: address.firstName || '',
    lastName: address.lastName || '',
    address: address.address || '',
    address2: address.address2 || '',
    city: address.city || '',
    state: address.state || '',
    zip: address.zip || '',
    country: address.country || 'US',
    phone: address.phone || '',
  });
};

const selectBillingAddress = () => {
  const selected = savedAddresses.value.find((address) => String(address.id) === billingAddressId.value);
  if (selected) applyAddress(billing, selected);
};

const selectShippingAddress = () => {
  const selected = savedAddresses.value.find((address) => String(address.id) === shippingAddressId.value);
  if (selected) applyAddress(shipping, selected);
};

const toggleShippingAddress = () => {
  if (differentShipping.value) {
    shippingAddressId.value = '';
    applyAddress(shipping, billing);
  } else {
    shippingAddressId.value = '';
  }
};

onMounted(async () => {
  try {
    const [methodsResponse, addressesResponse] = await Promise.all([
      api.get('/api/checkout/payment-methods'),
      api.get('/api/orders/addresses'),
    ]);
    paymentMethods.value = Object.entries(methodsResponse.data?.data || {})
      .filter(([, enabled]) => enabled)
      .map(([key]) => ({ key, label: methodLabels[key] }));
    if (paymentMethods.value.length && !paymentMethods.value.some((method) => method.key === form.paymentMethod)) {
      form.paymentMethod = paymentMethods.value[0].key;
    }
    savedAddresses.value = addressesResponse.data?.data || [];
    const defaultBilling = savedAddresses.value.find((address) => address.type === 'billing' && address.isDefault)
      || savedAddresses.value.find((address) => address.type === 'billing')
      || savedAddresses.value.find((address) => address.isDefault)
      || savedAddresses.value[0];
    if (defaultBilling) {
      billingAddressId.value = String(defaultBilling.id);
      selectBillingAddress();
    }
  } catch (err) {
    error.value = 'Could not load payment methods and saved addresses.';
  }
});

const submitOrder = async () => {
  error.value = '';
  if (!authStore.token) {
    error.value = 'Sign in before placing an order.';
    return;
  }
  if (!items.value.length) {
    error.value = 'Your cart is empty.';
    return;
  }
  const paymentMethod = form.paymentMethod;

  const payload = {
    items: items.value.map((item) => ({
      productId: item.id,
      productName: item.name,
      sku: item.sku || '',
      priceCents: Math.round(Number(item.price || 0) * 100),
      quantity: Number(item.quantity || 1),
    })),
    billingAddressId: billingAddressId.value || null,
    shippingAddressId: differentShipping.value ? shippingAddressId.value || null : null,
    shippingSameAsBilling: !differentShipping.value,
    paymentMethod,
    shippingCostCents: 1000,
    discountCents: 0,
    taxRate: 0.08,
    customer: {
      ...billing,
    },
    shippingCustomer: differentShipping.value ? { ...shipping } : null,
  };

  try {
    const order = await orderStore.createOrder(payload);
    if (paymentMethod === 'stripe' || paymentMethod === 'paypal') {
      await orderStore.createPaymentSession(paymentMethod, order.grandTotalCents, order.id);
    }
    cartStore.clear();
    router.push('/payment-success');
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Unable to place your order.';
  }
};
</script>

<style scoped>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.page-shell h1 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 2.4rem;
}
.checkout-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.4rem;
}
.form-card,
.summary {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1.2rem;
}
.form-card {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.form-card section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.form-card h3,
.summary h3 {
  margin-top: 0;
  margin-bottom: 0.8rem;
}
.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-weight: 600;
}
.shipping-toggle {
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
}
.shipping-toggle input {
  width: 1rem;
  height: 1rem;
  accent-color: #1d5a46;
}
.address-note {
  margin: 0;
  color: #64736b;
}
input,
select {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
  background: white;
}
.primary {
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.2rem;
  background: #111827;
  color: white;
  font-weight: 700;
  cursor: pointer;
}
.summary-item,
.row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.row.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 1.1rem;
}
@media (max-width: 900px) {
  .checkout-grid,
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>

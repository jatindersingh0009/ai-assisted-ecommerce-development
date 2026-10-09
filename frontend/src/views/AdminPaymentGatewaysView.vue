<template>
  <div class="page-shell">
    <AdminNav />
    <header class="page-header"><div><p class="eyebrow">Payments</p><h1>Payment gateways</h1></div></header>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <section class="gateway-list">
      <article v-for="gateway in gatewayList" :key="gateway.key" class="gateway-row">
        <div><h2>{{ gateway.label }}</h2><p>{{ gateway.description }}</p></div>
        <label class="toggle"><input v-model="state.gateways[gateway.key]" type="checkbox" :disabled="!canEdit" :aria-label="`${gateway.label} enabled`" @change="saveToggle(gateway.key)" /><span>{{ state.gateways[gateway.key] ? 'Enabled' : 'Disabled' }}</span></label>
        <div class="health"><span :class="state.credentials[gateway.key]?.configured || gateway.key === 'cod' ? 'ready' : 'missing'">{{ gateway.key === 'cod' ? 'No credentials required' : state.credentials[gateway.key]?.configured ? 'Credentials saved' : 'Credentials missing' }}</span>
          <span v-if="state.tests[gateway.key]" :class="state.tests[gateway.key].working ? 'ready' : 'missing'">{{ state.tests[gateway.key].message }}</span>
          <button v-if="canEdit" @click="test(gateway.key)">Test connection</button>
        </div>
      </article>
    </section>

    <form v-if="canEdit" class="credentials" @submit.prevent="saveCredentials">
      <h2>Provider credentials</h2>
      <p class="notice">Secret fields are encrypted before database storage and never returned to the browser. Leave a field blank to keep its saved value.</p>
      <fieldset>
        <legend>Stripe</legend>
        <p>Secret key: {{ state.credentials.stripe?.configured ? 'Configured' : 'Not configured' }} · Publishable key: {{ state.credentials.stripe?.publishableConfigured ? 'Configured' : 'Not configured' }} · Webhook signing secret: {{ state.credentials.stripe?.webhookConfigured ? 'Configured' : 'Not configured' }}</p>
        <label>Secret key<input v-model="form.stripeSecretKey" type="password" autocomplete="new-password" placeholder="sk_test_…" /></label>
        <label>Publishable key<input v-model="form.stripePublishableKey" type="password" autocomplete="new-password" placeholder="pk_test_…" /></label>
        <label>Webhook signing secret<input v-model="form.stripeWebhookSecret" type="password" autocomplete="new-password" placeholder="whsec_…" /></label>
      </fieldset>
      <fieldset>
        <legend>PayPal</legend>
        <p>Credentials: {{ state.credentials.paypal?.configured ? 'Configured' : 'Not configured' }} · Environment: {{ state.credentials.paypal?.environment || 'sandbox' }}</p>
        <label>Client ID<input v-model="form.paypalClientId" type="password" autocomplete="new-password" /></label>
        <label>Client secret<input v-model="form.paypalClientSecret" type="password" autocomplete="new-password" /></label>
        <label>Environment<select v-model="form.paypalEnvironment"><option value="sandbox">Sandbox</option><option value="live">Live</option></select></label>
      </fieldset>
      <p v-if="message" class="success" role="status">{{ message }}</p>
      <button class="primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save credentials' }}</button>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import AdminNav from '../components/AdminNav.vue';
import { useAdminStore } from '../stores/adminStore';
import { useAuthStore } from '../stores/authStore';
const store = useAdminStore();
const auth = useAuthStore();
const canEdit = auth.user?.role === 'super_admin' || auth.user?.permissions?.['payment_gateways.edit'] === true;
const gatewayList = [
  { key: 'stripe', label: 'Stripe', description: 'Card payments and webhook events.' },
  { key: 'paypal', label: 'PayPal', description: 'PayPal checkout orders.' },
  { key: 'cod', label: 'Cash on delivery', description: 'Collect payment on delivery.' },
];
const state = reactive({ gateways: {}, credentials: {}, tests: {} });
const form = reactive({ stripeSecretKey: '', stripePublishableKey: '', stripeWebhookSecret: '', paypalClientId: '', paypalClientSecret: '', paypalEnvironment: 'sandbox' });
const error = ref(''); const message = ref(''); const saving = ref(false);
const load = async () => {
  try { Object.assign(state, await store.fetchPaymentCredentialStatus()); }
  catch (err) { error.value = err.response?.data?.message || 'Could not load gateway settings.'; }
};
const saveToggle = async (key) => {
  error.value = ''; message.value = '';
  try { state.gateways = await store.updatePaymentGateways({ [key]: state.gateways[key] }); message.value = 'Gateway availability saved.'; }
  catch (err) { state.gateways[key] = !state.gateways[key]; error.value = err.response?.data?.message || 'Could not save gateway state.'; }
};
const saveCredentials = async () => {
  saving.value = true; error.value = ''; message.value = '';
  try {
    await store.savePaymentCredentials({ ...form });
    Object.assign(form, { stripeSecretKey: '', stripePublishableKey: '', stripeWebhookSecret: '', paypalClientId: '', paypalClientSecret: '' });
    message.value = 'Credentials encrypted and saved.';
    await load();
  } catch (err) { error.value = err.response?.data?.message || 'Could not save credentials.'; }
  finally { saving.value = false; }
};
const test = async (provider) => {
  error.value = '';
  try { state.tests[provider] = await store.testPaymentProvider(provider); }
  catch (err) { error.value = err.response?.data?.message || `Could not test ${provider}.`; }
};
onMounted(load);
</script>

<style scoped>
.page-shell { max-width: 1100px; margin: auto; padding: 2rem 1.25rem 4rem; }.page-header { margin-bottom: 1.2rem; }.eyebrow { margin: 0; color: #27634d; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; } h1 { margin: 0.35rem 0 0; }
.gateway-list,.credentials { display: grid; gap: 0.9rem; margin-bottom: 1rem; }.gateway-row,.credentials { padding: 1.1rem; background: white; border: 1px solid #d8dedb; border-radius: 7px; }.gateway-row { display: grid; grid-template-columns: 1fr auto minmax(180px, 0.7fr); gap: 1rem; align-items: center; }.gateway-row h2 { margin: 0 0 0.3rem; font-size: 1.05rem; }.gateway-row p,.notice { margin: 0; color: #64736b; }.toggle { display: flex; align-items: center; gap: 0.5rem; }.toggle input { width: 1.1rem; height: 1.1rem; accent-color: #1d5a46; }.health { display: grid; gap: 0.35rem; }.health button { justify-self: start; }.ready { color: #166534; }.missing,.error { color: #b42318; }
.credentials { gap: 1rem; }.credentials h2 { margin: 0; }.credentials fieldset { display: grid; gap: 0.7rem; border: 1px solid #d8dedb; border-radius: 5px; padding: 1rem; }.credentials legend { font-weight: 700; }.credentials label { display: grid; gap: 0.35rem; font-weight: 600; }.credentials input,.credentials select { padding: 0.65rem; border: 1px solid #bcc7c1; border-radius: 4px; }.primary { justify-self: start; padding: 0.75rem 1rem; border: 0; border-radius: 5px; color: white; background: #1d5a46; font-weight: 700; }.success { color: #166534; }
@media (max-width: 700px) { .gateway-row { grid-template-columns: 1fr; } }
</style>
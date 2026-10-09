<template>
  <div class="page-shell">
    <AdminNav />
    <header class="page-header"><div><p class="eyebrow">Store configuration</p><h1>Settings</h1></div></header>
    <form class="settings-form" @submit.prevent="save">
      <label>Currency<input v-model="settings.currency" required maxlength="10" /></label>
      <label>Tax rate (decimal)<input v-model="settings.tax_rate" type="number" min="0" max="1" step="0.001" required /></label>
      <label>Standard shipping (cents)<input v-model="settings.shipping_default_price_cents" type="number" min="0" step="1" required /></label>
      <label>Cash-on-delivery fee (cents)<input v-model="settings.cod_fee_cents" type="number" min="0" step="1" required /></label>
      <p v-if="message" class="success" role="status">{{ message }}</p><p v-if="error" class="error" role="alert">{{ error }}</p>
      <button v-if="canEdit" class="primary" :disabled="saving">Save settings</button>
    </form>
    <form class="settings-form smtp-form" @submit.prevent="saveSmtp">
      <h2>Email delivery (SMTP)</h2>
      <p v-if="smtpStatus.configured">SMTP configured for {{ smtpStatus.host }}:{{ smtpStatus.port }}. Password: {{ smtpStatus.passwordConfigured ? 'saved' : 'not set' }}.</p>
      <p v-else>SMTP is not configured. Password values are write-only and encrypted at rest.</p>
      <label>SMTP host<input v-model="smtp.host" placeholder="smtp.example.com" required /></label>
      <label>SMTP port<input v-model="smtp.port" type="number" min="1" max="65535" required /></label>
      <label>SMTP username<input v-model="smtp.user" autocomplete="username" /></label>
      <label>SMTP password<input v-model="smtp.password" type="password" autocomplete="new-password" placeholder="Leave blank to keep saved password" /></label>
      <label>Sender address<input v-model="smtp.from" type="text" placeholder="Store name &lt;shop@example.com&gt;" required /></label>
      <div v-if="canEdit" class="actions"><button class="primary" :disabled="smtpSaving">Save SMTP</button><button type="button" @click="testSmtp">Test connection</button></div>
      <p v-if="smtpMessage" class="success" role="status">{{ smtpMessage }}</p><p v-if="smtpError" class="error" role="alert">{{ smtpError }}</p>
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
const canEdit = auth.user?.role === 'super_admin' || auth.user?.permissions?.['settings.edit'] === true;
const settings = reactive({ currency: 'USD', tax_rate: '0.08', shipping_default_price_cents: '1000', cod_fee_cents: '1000' });
const message = ref(''); const error = ref(''); const saving = ref(false);
const smtp = reactive({ host: '', port: '587', user: '', password: '', from: '' });
const smtpStatus = reactive({ configured: false, passwordConfigured: false, host: '', port: 587 });
const smtpMessage = ref(''); const smtpError = ref(''); const smtpSaving = ref(false);
onMounted(async () => {
  try {
    const [values, smtpValues] = await Promise.all([store.fetchStoreSettings(), store.fetchSmtpStatus()]);
    Object.assign(settings, values);
    Object.assign(smtpStatus, smtpValues);
    Object.assign(smtp, { host: smtpValues.host || '', port: String(smtpValues.port || 587), user: '', password: '', from: smtpValues.from || '' });
  } catch (err) { error.value = err.response?.data?.message || 'Could not load store settings.'; }
});
const save = async () => { saving.value = true; message.value = ''; error.value = ''; try { Object.assign(settings, await store.updateStoreSettings({ ...settings })); message.value = 'Settings saved.'; } catch (err) { error.value = err.response?.data?.message || 'Could not save settings.'; } finally { saving.value = false; } };
const saveSmtp = async () => {
  smtpSaving.value = true; smtpError.value = ''; smtpMessage.value = '';
  try {
    Object.assign(smtpStatus, await store.saveSmtp({ ...smtp, port: String(smtp.port) }));
    smtp.password = '';
    smtpMessage.value = 'SMTP settings saved.';
  } catch (err) { smtpError.value = err.response?.data?.message || 'Could not save SMTP settings.'; }
  finally { smtpSaving.value = false; }
};
const testSmtp = async () => {
  smtpError.value = ''; smtpMessage.value = 'Testing SMTP connection…';
  try { const result = await store.testSmtp(); smtpMessage.value = result.message; if (!result.working) smtpError.value = result.message; }
  catch (err) { smtpError.value = err.response?.data?.message || 'SMTP test failed.'; smtpMessage.value = ''; }
};
</script>

<style scoped>
.page-shell { max-width: 900px; margin: auto; padding: 2rem 1.25rem 4rem; }.page-header { margin-bottom: 1.2rem; }.eyebrow { margin: 0; color: #27634d; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; } h1 { margin: 0.35rem 0 0; }
.settings-form { display: grid; gap: 1rem; padding: 1.25rem; background: #fff; border: 1px solid #d8dedb; border-radius: 7px; }.settings-form label { display: grid; gap: 0.4rem; font-weight: 650; }.settings-form input { padding: 0.7rem; border: 1px solid #bcc7c1; border-radius: 5px; }.primary { justify-self: start; border: 0; border-radius: 5px; padding: 0.75rem 1rem; background: #1d5a46; color: white; font-weight: 700; }.success { color: #166534; }.error { color: #b42318; }
.smtp-form { margin-top: 1rem; }.smtp-form h2,.smtp-form p { margin: 0; }.actions { display: flex; gap: 0.7rem; }
</style>
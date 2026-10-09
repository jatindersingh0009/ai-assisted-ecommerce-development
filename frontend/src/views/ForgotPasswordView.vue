<template>
  <div class="auth-shell">
    <form class="auth-card" @submit.prevent="submit">
      <h1>Forgot password</h1>
      <label>Email<input v-model="email" type="email" required autocomplete="email" /></label>
      <p v-if="message" role="status">{{ message }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <router-link v-if="resetUrl" :to="resetUrl">Continue to reset password</router-link>
      <button type="submit" :disabled="loading">{{ loading ? 'Sending…' : 'Send reset link' }}</button>
      <router-link to="/login">Back to login</router-link>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../services/api';

const email = ref('');
const message = ref('');
const error = ref('');
const resetUrl = ref('');
const loading = ref(false);

const submit = async () => {
  loading.value = true;
  error.value = '';
  message.value = '';
  resetUrl.value = '';
  try {
    const { data } = await api.post('/api/auth/forgot-password', { email: email.value });
    message.value = data.message;
    if (data.data?.resetToken) resetUrl.value = `/reset-password?token=${encodeURIComponent(data.data.resetToken)}`;
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not request a password reset.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-shell { min-height: 70vh; display: grid; place-items: center; padding: 2rem 1rem; }
.auth-card { width: min(100%, 440px); display: grid; gap: 1rem; padding: 2rem; background: #fff; border: 1px solid #d8dedb; border-radius: 8px; }
label { display: grid; gap: 0.45rem; font-weight: 600; }
input { padding: 0.8rem; border: 1px solid #bcc7c1; border-radius: 5px; }
button { padding: 0.85rem; border: 0; border-radius: 5px; background: #1d5a46; color: #fff; font-weight: 700; cursor: pointer; }
.error { color: #b42318; }
</style>
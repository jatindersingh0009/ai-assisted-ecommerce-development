<template>
  <div class="auth-shell">
    <form class="auth-card" @submit.prevent="submit">
      <h1>Reset password</h1>
      <label>New password<input v-model="password" type="password" minlength="8" required autocomplete="new-password" /></label>
      <label>Confirm password<input v-model="confirmPassword" type="password" minlength="8" required autocomplete="new-password" /></label>
      <p v-if="message" role="status">{{ message }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <router-link v-if="completed" to="/login">Continue to login</router-link>
      <button v-else type="submit" :disabled="loading || !token">{{ loading ? 'Updating…' : 'Update password' }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const token = String(route.query.token || '');
const password = ref('');
const confirmPassword = ref('');
const message = ref('');
const error = ref(token ? '' : 'This password reset link is invalid.');
const loading = ref(false);
const completed = ref(false);

const submit = async () => {
  error.value = '';
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.post('/api/auth/reset-password', { token, password: password.value });
    message.value = data.message;
    completed.value = true;
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not reset password.';
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
<template>
  <div class="auth-shell">
    <div class="auth-card">
      <h1>Create account</h1>
      <form @submit.prevent="submit">
        <label>
          Full name
          <input v-model="form.name" required />
        </label>
        <label>
          Email
          <input v-model="form.email" type="email" required />
        </label>
        <label>
          Password
          <input v-model="form.password" type="password" required />
        </label>
        <label>
          Confirm password
          <input v-model="form.confirmPassword" type="password" required />
        </label>
        <p v-if="authStore.error" class="error" role="alert">{{ authStore.error }}</p>
        <button type="submit" class="primary">Register</button>
      </form>
      <p>
        Already have an account? <router-link to="/login">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const form = reactive({ name: '', email: '', password: '', confirmPassword: '' });

const submit = async () => {
  const payload = {
    ...form,
    name: form.name,
  };

  try {
    await authStore.register(payload);
    router.push('/');
  } catch (err) {
    return;
  }
};
</script>

<style scoped>
.auth-shell {
  min-height: 70vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
}
.auth-card {
  width: min(100%, 460px);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 2rem;
}
.auth-card h1 {
  margin-top: 0;
  margin-bottom: 1rem;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-weight: 600;
}
input {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
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
.error {
  color: #b42318;
  margin: 0;
}
</style>

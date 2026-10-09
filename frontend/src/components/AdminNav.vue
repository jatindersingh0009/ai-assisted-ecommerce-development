<template>
  <nav class="admin-nav" aria-label="Admin sections">
    <router-link v-for="item in visibleItems" :key="item.to" :to="item.to" :class="{ active: route.path === item.to }">
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { adminRoute } from '../config/adminPath';

const route = useRoute();
const authStore = useAuthStore();
const items = [
  { label: 'Dashboard', to: adminRoute(), permission: 'dashboard.view' },
  { label: 'Products', to: adminRoute('products'), permission: 'products.view' },
  { label: 'Categories', to: adminRoute('categories'), permission: 'categories.view' },
  { label: 'Orders', to: adminRoute('orders'), permission: 'orders.view' },
  { label: 'Customers', to: adminRoute('customers'), permission: 'customers.view' },
  { label: 'Users & roles', to: adminRoute('users'), permission: 'users.view' },
  { label: 'Settings', to: adminRoute('settings'), permission: 'settings.view' },
  { label: 'Payment gateways', to: adminRoute('payment-gateways'), permission: 'payment_gateways.view' },
  { label: 'Manage pages', to: adminRoute('pages'), permission: 'content.view' },
  { label: 'Manage posts', to: adminRoute('posts'), permission: 'content.view' },
];
const visibleItems = computed(() => authStore.user?.role === 'super_admin'
  ? items
  : items.filter((item) => authStore.user?.permissions?.[item.permission] === true));
</script>

<style scoped>
.admin-nav { display: flex; gap: 0.25rem; overflow-x: auto; margin: 0 0 1.5rem; padding: 0 0 0.5rem; border-bottom: 1px solid #d6ded9; }
.admin-nav a { flex: 0 0 auto; padding: 0.65rem 0.8rem; color: #42534b; text-decoration: none; font-size: 0.92rem; font-weight: 650; border-radius: 5px; }
.admin-nav a:hover, .admin-nav a.active { color: #154b38; background: #e7f1eb; }
</style>
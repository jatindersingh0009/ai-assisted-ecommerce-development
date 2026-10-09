<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link class="brand" to="/">Claude Commerce</router-link>

      <nav class="nav">
        <router-link to="/">Home</router-link>
        <router-link to="/products">Shop</router-link>
        <router-link to="/products">Categories</router-link>
        <router-link to="/checkout">Checkout</router-link>
        <router-link v-if="user" to="/account">Account</router-link>
        <router-link v-if="user && ['admin', 'super_admin'].includes(user.role)" :to="adminPath">Admin</router-link>
        <router-link v-else to="/login">Login</router-link>
      </nav>

      <div class="right-actions">
        <button class="outline" @click="logout" v-if="user">Logout</button>
        <router-link class="cta" to="/cart">Cart ({{ cartCount }})</router-link>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <Transition name="cart-notice">
      <aside v-if="cartNotice" class="cart-notice" role="status" aria-live="polite">
        <img v-if="cartNotice.image" :src="cartNotice.image" :alt="cartNotice.name" />
        <div class="cart-notice-copy">
          <strong>Added to cart</strong>
          <span>{{ cartNotice.name }}</span>
          <router-link to="/cart">View cart ({{ cartCount }})</router-link>
        </div>
        <button class="notice-close" type="button" aria-label="Dismiss cart notification" @click="cartStore.dismissNotice">×</button>
      </aside>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/authStore';
import { useCartStore } from './stores/cartStore';
import { adminPath } from './config/adminPath';

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();

const user = computed(() => authStore.user);
const cartCount = computed(() => cartStore.count);
const cartNotice = computed(() => cartStore.lastAdded);

onMounted(async () => {
  await authStore.hydrateUser();
  await cartStore.hydrateFromServer();
});

const logout = () => {
  authStore.logout();
  router.replace('/');
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f7f7fb;
  color: #111827;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.1rem 1.25rem;
  position: sticky;
  top: 0;
  background: rgba(247, 247, 251, 0.9);
  backdrop-filter: blur(10px);
  z-index: 20;
}

.brand {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  text-decoration: none;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.15rem;
}

.nav a,
.right-actions a,
.right-actions button {
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.cta,
.outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 700;
}

.cta {
  background: #111827;
  color: white;
}

.outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #111827;
}

.main-content {
  min-height: calc(100vh - 80px);
}

.cart-notice {
  position: fixed;
  right: max(1rem, calc((100vw - 1200px) / 2));
  bottom: 1rem;
  z-index: 50;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  width: min(390px, calc(100vw - 2rem));
  padding: 0.85rem;
  background: #fff;
  border: 1px solid #c7d7ce;
  border-left: 4px solid #1d7653;
  border-radius: 7px;
  box-shadow: 0 12px 36px rgba(23, 47, 36, 0.18);
}
.cart-notice img { width: 54px; height: 54px; object-fit: cover; border-radius: 4px; background: #eef2ef; }
.cart-notice-copy { display: grid; gap: 0.2rem; min-width: 0; }
.cart-notice-copy strong { color: #15563d; }
.cart-notice-copy span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #39483f; }
.cart-notice-copy a { color: #176847; font-weight: 700; font-size: 0.9rem; }
.notice-close { border: 0; background: transparent; color: #516158; font-size: 1.35rem; cursor: pointer; }
.cart-notice-enter-active, .cart-notice-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.cart-notice-enter-from, .cart-notice-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 768px) {
  .topbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>

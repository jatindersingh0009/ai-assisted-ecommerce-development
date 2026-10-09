<template>
  <div class="page-shell">
    <h1>Your cart</h1>

    <div v-if="items.length === 0" class="empty">
      <p>Your cart is empty.</p>
      <router-link to="/products" class="primary">Continue shopping</router-link>
    </div>

    <div v-else class="cart-layout">
      <div class="items-list">
        <div v-for="item in items" :key="item.id" class="cart-item">
          <img :src="item.image" :alt="item.name" />
          <div class="info">
            <h3>{{ item.name }}</h3>
            <p>{{ formatCurrency(item.price) }}</p>
          </div>
          <div class="quantity-box">
            <button @click="decrement(item)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="increment(item)">+</button>
          </div>
          <button class="remove" @click="removeItem(item.id)">Remove</button>
        </div>
      </div>

      <aside class="summary">
        <h3>Order summary</h3>
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

        <router-link to="/checkout" class="primary primary-full">Proceed to checkout</router-link>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCartStore } from '../stores/cartStore';

const cartStore = useCartStore();
const items = computed(() => cartStore.items);
const subtotal = computed(() => cartStore.subtotal);

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const increment = (item) => {
  cartStore.updateQuantity(item.id, item.quantity + 1);
};

const decrement = (item) => {
  if (item.quantity <= 1) return;
  cartStore.updateQuantity(item.id, item.quantity - 1);
};

const removeItem = (id) => {
  cartStore.removeItem(id);
};
</script>

<style scoped>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.page-shell h1 {
  margin-bottom: 1.5rem;
  font-size: 2.4rem;
}
.empty {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 2rem;
  text-align: center;
}
.primary {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: #111827;
  color: white;
  border-radius: 999px;
  padding: 0.8rem 1.2rem;
  text-decoration: none;
  font-weight: 700;
}
.primary-full {
  width: 100%;
}
.cart-layout {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 1.4rem;
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.cart-item {
  display: grid;
  grid-template-columns: 100px 1fr auto auto;
  gap: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1rem;
  align-items: center;
}
.cart-item img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
}
.info h3 {
  margin: 0 0 0.25rem;
}
.info p {
  margin: 0;
  color: #6b7280;
}
.quantity-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.quantity-box button {
  width: 30px;
  height: 30px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.remove {
  border: none;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  font-weight: 700;
}
.summary {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1rem;
  height: fit-content;
}
.summary h3 {
  margin-top: 0;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.row.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 1.15rem;
}
@media (max-width: 800px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
  .cart-item {
    grid-template-columns: 1fr;
  }
}
</style>

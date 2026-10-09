<template>
  <article class="product-card">
    <div class="product-image-wrap">
      <img :src="product.image" :alt="product.name" />
      <span v-if="product.salePrice" class="sale-badge">Sale</span>
    </div>

    <div class="product-body">
      <p class="product-category">{{ product.category }}</p>
      <h3>{{ product.name }}</h3>
      <div class="price-row">
        <strong>{{ formatCurrency(product.salePrice || product.price) }}</strong>
        <span v-if="product.salePrice">{{ formatCurrency(product.price) }}</span>
      </div>
      <p class="description">{{ product.shortDescription }}</p>

      <div class="actions">
        <button class="primary" :class="{ added: justAdded }" @click="addToCart">
          <span class="button-mark" aria-hidden="true">{{ justAdded ? '✓' : '+' }}</span>
          {{ justAdded ? 'Added' : 'Add to cart' }}
        </button>
        <button class="ghost" @click="viewProduct">View</button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cartStore';

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const cartStore = useCartStore();
const justAdded = ref(false);
let feedbackTimer;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);
};

const addToCart = async () => {
  await cartStore.addItem(props.product);
  justAdded.value = true;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { justAdded.value = false; }, 1400);
};

onBeforeUnmount(() => clearTimeout(feedbackTimer));

const viewProduct = () => {
  router.push({ name: 'product-detail', params: { slug: props.product.slug } });
};
</script>

<style scoped>
.product-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.product-image-wrap {
  position: relative;
  height: 240px;
  background: #f3f4f6;
}

.product-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sale-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #ef4444;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
}

.product-body {
  padding: 1rem 1rem 1.25rem;
}

.product-category {
  margin: 0 0 0.4rem;
  color: #6b7280;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.product-body h3 {
  margin: 0 0 0.7rem;
  font-size: 1.15rem;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
}

.price-row strong {
  font-size: 1.08rem;
}

.price-row span {
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 0.9rem;
}

.description {
  margin: 0 0 1rem;
  color: #4b5563;
  min-height: 50px;
}

.actions {
  display: flex;
  gap: 0.6rem;
}

.primary,
.ghost {
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

.primary {
  background: #111827;
  color: white;
  flex: 1;
}
.button-mark { display: inline-grid; place-items: center; width: 1.15rem; height: 1.15rem; margin-right: 0.25rem; border-radius: 50%; background: rgba(255,255,255,0.16); }
.primary.added { background: #176847; animation: add-confirm 320ms ease-out; }
@keyframes add-confirm { 50% { transform: scale(1.035); } }

.ghost {
  background: #f3f4f6;
  color: #111827;
}
</style>

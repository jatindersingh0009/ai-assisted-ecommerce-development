<template>
  <div class="page-shell">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Modern home essentials</p>
        <h1>Curated design for everyday living.</h1>
        <p>
          Premium furniture, décor, lighting, and storage from a storefront built for modern commerce.
        </p>
        <div class="actions">
          <router-link class="primary" to="/products">Shop now</router-link>
          <router-link class="secondary" to="/products">Explore catalog</router-link>
        </div>
      </div>

      <div class="hero-showcase">
        <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80" alt="Featured sale" />
      </div>
    </section>

    <section class="section-wrap">
      <div class="section-header">
        <h2>Featured products</h2>
      </div>
      <div class="product-grid">
        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useProductStore } from '../stores/productStore';
import ProductCard from '../components/ProductCard.vue';

const productStore = useProductStore();
const featuredProducts = computed(() => productStore.featured);

onMounted(async () => {
  await productStore.fetchFeaturedProducts();
});
</script>

<style scoped>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 2rem;
  align-items: center;
  padding: 2rem 0 3rem;
}
.hero-copy h1 {
  margin: 0.5rem 0 1rem;
  font-size: clamp(2.5rem, 5vw, 4.3rem);
  line-height: 1.02;
  letter-spacing: -0.06em;
}
.hero-copy p {
  color: #4b5563;
  font-size: 1.05rem;
}
.eyebrow {
  color: #4f46e5;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 800;
}
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
.primary,
.secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.9rem 1.3rem;
  font-weight: 700;
  text-decoration: none;
}
.primary {
  background: #111827;
  color: white;
}
.secondary {
  background: white;
  color: #111827;
  border: 1px solid #d1d5db;
}
.hero-showcase img {
  width: 100%;
  border-radius: 24px;
  min-height: 420px;
  object-fit: cover;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.12);
}
.section-wrap {
  margin-top: 1rem;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}
.section-header h2 {
  font-size: 2rem;
  margin: 0;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.2rem;
}
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>

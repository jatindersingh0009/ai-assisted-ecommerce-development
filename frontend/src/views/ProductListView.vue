<template>
  <div class="page-shell">
    <div class="header-row">
      <h1>Catalog</h1>
      <div class="pill">{{ products.length }} items</div>
    </div>

    <div class="catalog-layout">
      <aside class="filters">
        <h3>Filters</h3>
        <label>
          Search
          <input v-model="search" placeholder="Search products" />
        </label>
        <label>
          Max price
          <input v-model="maxPrice" type="number" placeholder="500" />
        </label>
        <button class="primary" @click="applyFilters">Apply</button>
      </aside>

      <div class="products-area">
        <div class="product-grid">
          <ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useProductStore } from '../stores/productStore';
import ProductCard from '../components/ProductCard.vue';

const productStore = useProductStore();
const search = ref('');
const maxPrice = ref('');
const products = computed(() => productStore.products);

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesSearch = !search.value || product.name.toLowerCase().includes(search.value.toLowerCase()) || product.category.toLowerCase().includes(search.value.toLowerCase());
    const matchesPrice = !maxPrice.value || Number(product.salePrice || product.price) <= Number(maxPrice.value);
    return matchesSearch && matchesPrice;
  });
});

const applyFilters = () => {
  productStore.fetchProducts({
    search: search.value,
    maxPrice: maxPrice.value,
  });
};

onMounted(async () => {
  await productStore.fetchProducts();
});
</script>

<style scoped>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.header-row h1 {
  margin: 0;
  font-size: 2.4rem;
}
.pill {
  background: #eef2ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 0.5rem 0.85rem;
  font-weight: 700;
}
.catalog-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.5rem;
}
.filters {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1rem;
  height: fit-content;
}
.filters h3 {
  margin-top: 0;
}
.filters label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
}
.filters input {
  width: 100%;
  margin-top: 0.4rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
}
.primary {
  width: 100%;
  border: none;
  border-radius: 999px;
  background: #111827;
  color: white;
  padding: 0.8rem 1rem;
  font-weight: 700;
  cursor: pointer;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
}
@media (max-width: 900px) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }
}
</style>

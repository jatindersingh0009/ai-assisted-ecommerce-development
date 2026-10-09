<template>
  <div class="page-shell">
    <AdminNav />
    <div class="header-row">
      <div>
        <p class="eyebrow">Catalog management</p>
        <h1>Products</h1>
      </div>
      <button v-if="can('products.create')" class="primary" @click="openCreate">Add product</button>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form v-if="formOpen" class="product-form" @submit.prevent="saveProduct">
      <h2>{{ form.id ? 'Edit product' : 'Add product' }}</h2>
      <div class="form-grid">
        <label>Name<input v-model="form.name" required /></label>
        <label>SKU<input v-model="form.sku" required /></label>
        <label>Price<input v-model.number="form.price" type="number" min="0" step="0.01" required /></label>
        <label>Stock<input v-model.number="form.stockQty" type="number" min="0" step="1" required /></label>
        <label>Category ID<input v-model.number="form.categoryId" type="number" min="1" /></label>
        <label>Brand<input v-model="form.brand" /></label>
        <label>Status<select v-model="form.status"><option value="active">Active</option><option value="draft">Draft</option><option value="disabled">Disabled</option></select></label>
        <label class="checkbox"><input v-model="form.featured" type="checkbox" /> Featured</label>
      </div>
      <label>Short description<textarea v-model="form.shortDescription" rows="2" /></label>
      <div class="form-actions"><button class="primary" type="submit">Save product</button><button type="button" @click="formOpen = false">Cancel</button></div>
    </form>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ formatCurrency(product.price) }}</td>
            <td>{{ product.stock }}</td>
            <td><span class="status" :class="product.stock > 0 ? 'in-stock' : 'out'">{{ product.stock > 0 ? 'In stock' : 'Out of stock' }}</span></td>
            <td class="actions">
              <button v-if="can('products.edit')" class="link-btn" @click="openEdit(product)">Edit</button>
              <button v-if="can('products.delete')" class="link-btn danger" @click="removeProduct(product)">Delete</button>
            </td>
          </tr>
          <tr v-if="!products.length"><td colspan="6">No products found.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import AdminNav from '../components/AdminNav.vue';
import { useAuthStore } from '../stores/authStore';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const can = (permission) => authStore.user?.role === 'super_admin' || authStore.user?.permissions?.[permission] === true;
const products = ref([]);
const formOpen = ref(false);
const error = ref('');
const blankForm = () => ({ id: null, name: '', sku: '', price: 0, stockQty: 0, categoryId: null, brand: '', shortDescription: '', description: '', status: 'active', featured: false });
const form = reactive(blankForm());

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const loadProducts = async () => {
  try {
    products.value = await adminStore.fetchProducts();
    error.value = '';
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load products.';
  }
};

const openCreate = () => {
  Object.assign(form, blankForm());
  formOpen.value = true;
};

const openEdit = (product) => {
  Object.assign(form, {
    ...blankForm(),
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    stockQty: product.stock,
    categoryId: product.category_id,
    brand: product.brand || '',
    shortDescription: product.short_description || '',
    description: product.description || '',
    status: product.status,
    featured: Boolean(product.featured),
  });
  formOpen.value = true;
};

const saveProduct = async () => {
  try {
    await adminStore.upsertProduct(form);
    formOpen.value = false;
    await loadProducts();
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Could not save product.';
  }
};

const removeProduct = async (product) => {
  if (!window.confirm(`Delete ${product.name}?`)) return;
  try {
    await adminStore.deleteProduct(product.id);
    await loadProducts();
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Could not delete product.';
  }
};

onMounted(loadProducts);
</script>

<style scoped>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 800;
}
.header-row h1 {
  margin: 0.4rem 0 0;
  font-size: clamp(2rem, 4vw, 3rem);
}
.primary {
  border: none;
  border-radius: 999px;
  background: #111827;
  color: white;
  padding: 0.85rem 1.2rem;
  font-weight: 700;
}
.product-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.product-form h2 { margin: 0; font-size: 1.2rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }
.product-form label { display: grid; gap: 0.35rem; font-weight: 600; }
.product-form input, .product-form select, .product-form textarea { width: 100%; box-sizing: border-box; padding: 0.65rem; border: 1px solid #d1d5db; border-radius: 4px; }
.product-form .checkbox { display: flex; align-items: center; }
.product-form .checkbox input { width: auto; }
.form-actions { display: flex; gap: 0.7rem; }
.error { color: #b42318; }
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 1rem;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  text-align: left;
  padding: 0.9rem 0.6rem;
  border-bottom: 1px solid #f3f4f6;
}
.status {
  display: inline-flex;
  padding: 0.32rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}
.status.in-stock {
  background: #dcfce7;
  color: #166534;
}
.status.out {
  background: #fee2e2;
  color: #991b1b;
}
.actions {
  display: flex;
  gap: 0.6rem;
}
.link-btn {
  border: none;
  background: transparent;
  color: #111827;
  cursor: pointer;
  font-weight: 700;
}
.link-btn.danger {
  color: #dc2626;
}
@media (max-width: 900px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-grid { grid-template-columns: 1fr; }
}
</style>

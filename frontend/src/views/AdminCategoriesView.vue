<template>
  <div class="page-shell">
    <AdminNav />
    <header class="page-header"><div><p class="eyebrow">Catalog</p><h1>Categories</h1></div><button v-if="can('categories.create')" class="primary" @click="openNew">Add category</button></header>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form v-if="editing" class="editor" @submit.prevent="save">
      <h2>{{ form.id ? 'Edit category' : 'New category' }}</h2>
      <label>Name<input v-model="form.name" required /></label>
      <label>Description<textarea v-model="form.description" rows="2" /></label>
      <label>Status<select v-model="form.status"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      <div class="actions"><button class="primary">Save category</button><button type="button" @click="editing = false">Cancel</button></div>
    </form>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      <tr v-for="category in categories" :key="category.id"><td>{{ category.name }}</td><td>{{ category.slug }}</td><td>{{ category.status }}</td><td><button v-if="can('categories.edit')" @click="edit(category)">Edit</button><button v-if="can('categories.delete')" class="danger" @click="remove(category)">Delete</button></td></tr>
      <tr v-if="!categories.length"><td colspan="4">No categories found.</td></tr>
    </tbody></table></div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import AdminNav from '../components/AdminNav.vue';
import { useAdminStore } from '../stores/adminStore';
import { useAuthStore } from '../stores/authStore';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const can = (permission) => authStore.user?.role === 'super_admin' || authStore.user?.permissions?.[permission] === true;
const categories = ref([]);
const editing = ref(false);
const error = ref('');
const blank = () => ({ id: null, name: '', description: '', status: 'active' });
const form = reactive(blank());
const load = async () => { try { categories.value = await adminStore.fetchCategories(); error.value = ''; } catch (err) { error.value = err.response?.data?.message || 'Could not load categories.'; } };
const openNew = () => { Object.assign(form, blank()); editing.value = true; };
const edit = (item) => { Object.assign(form, { id: item.id, name: item.name, description: item.description || '', status: item.status }); editing.value = true; };
const save = async () => { try { await adminStore.saveCategory(form); editing.value = false; await load(); } catch (err) { error.value = err.response?.data?.message || 'Could not save category.'; } };
const remove = async (item) => { if (!window.confirm(`Delete category ${item.name}?`)) return; try { await adminStore.deleteCategory(item.id); await load(); } catch (err) { error.value = err.response?.data?.message || 'Could not delete category.'; } };
onMounted(load);
</script>

<style scoped>
.page-shell { max-width: 1200px; margin: auto; padding: 2rem 1.25rem 4rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.eyebrow { margin: 0; color: #27634d; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; }
h1 { margin: 0.35rem 0 0; }
.editor,.table-wrap { padding: 1.1rem; background: #fff; border: 1px solid #d8dedb; border-radius: 7px; margin-bottom: 1rem; }
.editor { display: grid; gap: 0.8rem; }
.editor h2 { margin: 0; font-size: 1.1rem; }
label { display: grid; gap: 0.35rem; font-weight: 600; }
input,textarea,select { width: 100%; box-sizing: border-box; padding: 0.65rem; border: 1px solid #bcc7c1; border-radius: 4px; }
.actions { display: flex; gap: 0.6rem; }
.primary { padding: 0.7rem 0.9rem; background: #1d5a46; color: white; border: 0; border-radius: 5px; font-weight: 700; cursor: pointer; }
table { width: 100%; border-collapse: collapse; } th,td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #edf0ee; }
td button { margin-right: 0.5rem; } .danger,.error { color: #b42318; }
</style>
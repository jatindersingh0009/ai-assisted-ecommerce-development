<template>
  <div class="page-shell">
    <AdminNav />
    <header class="page-header">
      <div><p class="eyebrow">Content management</p><h1>{{ contentType === 'pages' ? 'Manage pages' : 'Manage posts' }}</h1></div>
      <button v-if="section === 'content' && can('content.create')" class="primary" @click="newItem">Add {{ contentType === 'pages' ? 'page' : 'post' }}</button>
    </header>
    <div class="tabs">
      <button :class="{ active: section === 'content' }" @click="section = 'content'">{{ contentType === 'pages' ? 'Pages' : 'Posts' }}</button>
      <button v-if="contentType === 'posts'" :class="{ active: section === 'categories' }" @click="section = 'categories'">Categories</button>
      <button v-if="contentType === 'posts'" :class="{ active: section === 'tags' }" @click="section = 'tags'">Tags</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <template v-if="section === 'content'">
      <form v-if="editing" class="editor" @submit.prevent="saveItem">
        <h2>{{ form.id ? 'Edit content' : 'New content' }}</h2>
        <label>Title<input v-model="form.title" required /></label>
        <label>Slug<input v-model="form.slug" placeholder="Generated from title when blank" /></label>
        <label v-if="contentType === 'posts'">Category<select v-model="form.categoryId"><option value="">Uncategorized</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
        <label>Excerpt<textarea v-model="form.excerpt" rows="2" /></label>
        <label>Body<textarea v-model="form.body" rows="8" required /></label>
        <label>Status<select v-model="form.status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <fieldset v-if="contentType === 'posts'"><legend>Tags</legend><label v-for="tag in tags" :key="tag.id" class="tag-choice"><input v-model="form.tagIds" type="checkbox" :value="tag.id" />{{ tag.name }}</label><p v-if="!tags.length">Create tags in the Tags tab.</p></fieldset>
        <div class="actions"><button class="primary">Save</button><button type="button" @click="editing = false">Cancel</button></div>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Category / tags</th><th>Actions</th></tr></thead><tbody>
        <tr v-for="item in items" :key="item.id"><td>{{ item.title }}</td><td>{{ item.slug }}</td><td>{{ item.status }}</td><td>{{ item.category_name || 'Page' }}<span v-if="item.tags?.length"> · {{ item.tags.map((tag) => tag.name).join(', ') }}</span></td><td><button v-if="can('content.edit')" @click="editItem(item)">Edit</button><button v-if="can('content.delete')" class="danger" @click="removeItem(item)">Delete</button></td></tr>
        <tr v-if="!items.length"><td colspan="5">No content found.</td></tr>
      </tbody></table></div>
    </template>
    <section v-else class="taxonomy">
      <form v-if="can('content.create') || (taxonomyForm.id && can('content.edit'))" class="editor" @submit.prevent="saveTaxonomy">
        <h2>{{ section === 'categories' ? 'Post categories' : 'Post tags' }}</h2>
        <label>Name<input v-model="taxonomyForm.name" required /></label>
        <label v-if="section === 'categories'">Description<textarea v-model="taxonomyForm.description" rows="2" /></label>
        <div class="actions"><button class="primary">{{ taxonomyForm.id ? 'Update' : 'Add' }}</button><button v-if="taxonomyForm.id" type="button" @click="resetTaxonomy">Cancel</button></div>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Slug</th><th>Actions</th></tr></thead><tbody>
        <tr v-for="item in taxonomyItems" :key="item.id"><td>{{ item.name }}</td><td>{{ item.slug }}</td><td><button v-if="can('content.edit')" @click="editTaxonomy(item)">Edit</button><button v-if="can('content.delete')" class="danger" @click="deleteTaxonomy(item)">Delete</button></td></tr>
        <tr v-if="!taxonomyItems.length"><td colspan="3">No {{ section }} yet.</td></tr>
      </tbody></table></div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import AdminNav from '../components/AdminNav.vue';
import { useAdminStore } from '../stores/adminStore';
import { useAuthStore } from '../stores/authStore';

const props = defineProps({ contentType: { type: String, required: true } });
const store = useAdminStore();
const auth = useAuthStore();
const can = (permission) => auth.user?.role === 'super_admin' || auth.user?.permissions?.[permission] === true;
const contentType = ref(props.contentType);
const section = ref('content');
const items = ref([]); const categories = ref([]); const tags = ref([]); const taxonomyItems = ref([]);
const editing = ref(false); const error = ref('');
const blankItem = () => ({ id: null, title: '', slug: '', excerpt: '', body: '', status: 'draft', categoryId: '', tagIds: [] });
const form = reactive(blankItem());
const taxonomyForm = reactive({ id: null, name: '', description: '' });

const load = async () => {
  error.value = '';
  try {
    items.value = await store.fetchContent(contentType.value);
    if (contentType.value === 'posts') {
      [categories.value, tags.value] = await Promise.all([store.fetchContentCategories(), store.fetchContentTags()]);
      if (section.value !== 'content') taxonomyItems.value = section.value === 'categories' ? categories.value : tags.value;
    }
  } catch (err) { error.value = err.response?.data?.message || 'Could not load content.'; }
};
const newItem = () => { Object.assign(form, blankItem()); editing.value = true; };
const editItem = (item) => { Object.assign(form, { ...blankItem(), id: item.id, title: item.title, slug: item.slug, excerpt: item.excerpt || '', body: item.body, status: item.status, categoryId: item.category_id || '', tagIds: (item.tags || []).map((tag) => tag.id) }); editing.value = true; };
const saveItem = async () => { try { await store.saveContent(contentType.value, { ...form, categoryId: form.categoryId || null }); editing.value = false; await load(); } catch (err) { error.value = err.response?.data?.message || err.message || 'Could not save content.'; } };
const removeItem = async (item) => { if (!window.confirm(`Delete ${item.title}?`)) return; try { await store.deleteContent(contentType.value, item.id); await load(); } catch (err) { error.value = err.response?.data?.message || 'Could not delete content.'; } };
const resetTaxonomy = () => Object.assign(taxonomyForm, { id: null, name: '', description: '' });
const editTaxonomy = (item) => Object.assign(taxonomyForm, { id: item.id, name: item.name, description: item.description || '' });
const saveTaxonomy = async () => {
  try {
    if (section.value === 'categories') await store.saveContentCategory({ ...taxonomyForm });
    else await store.saveContentTag({ ...taxonomyForm });
    resetTaxonomy(); await load();
  } catch (err) { error.value = err.response?.data?.message || 'Could not save taxonomy item.'; }
};
const deleteTaxonomy = async (item) => {
  if (!window.confirm(`Delete ${item.name}?`)) return;
  try { if (section.value === 'categories') await store.deleteContentCategory(item.id); else await store.deleteContentTag(item.id); await load(); }
  catch (err) { error.value = err.response?.data?.message || 'Could not delete taxonomy item.'; }
};
watch(section, () => { if (contentType.value === 'posts' && section.value !== 'content') taxonomyItems.value = section.value === 'categories' ? categories.value : tags.value; });
watch(() => props.contentType, (value) => { contentType.value = value; section.value = 'content'; editing.value = false; load(); });
onMounted(load);
</script>

<style scoped>
.page-shell { max-width: 1200px; margin: auto; padding: 2rem 1.25rem 4rem; }.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }.eyebrow { margin: 0; color: #27634d; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; }h1 { margin: 0.35rem 0 0; }
.tabs { display: flex; gap: 0.4rem; margin-bottom: 1rem; border-bottom: 1px solid #d8dedb; }.tabs button { padding: 0.65rem 0.85rem; border: 0; background: transparent; color: #45564e; font-weight: 650; cursor: pointer; }.tabs button.active { color: #14543b; border-bottom: 2px solid #25835d; }
.editor,.table-wrap { padding: 1rem; margin-bottom: 1rem; background: #fff; border: 1px solid #d8dedb; border-radius: 7px; }.editor { display: grid; gap: 0.75rem; }.editor h2 { margin: 0; font-size: 1.1rem; }label { display: grid; gap: 0.35rem; font-weight: 600; }input,select,textarea { box-sizing: border-box; width: 100%; padding: 0.65rem; border: 1px solid #bcc7c1; border-radius: 4px; }.tag-choice { display: inline-flex; margin: 0.4rem 0.8rem 0.4rem 0; }.tag-choice input { width: auto; }.actions { display: flex; gap: 0.6rem; }.primary { padding: 0.7rem 0.9rem; border: 0; border-radius: 5px; background: #1d5a46; color: #fff; font-weight: 700; cursor: pointer; }
table { width: 100%; border-collapse: collapse; }th,td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #edf0ee; }td button { margin-right: 0.5rem; }.danger,.error { color: #b42318; }.taxonomy { display: grid; grid-template-columns: minmax(240px,0.7fr) 1.3fr; gap: 1rem; }
@media(max-width:750px){.taxonomy{grid-template-columns:1fr}.table-wrap{overflow-x:auto}}
</style>
<template>
  <div class="page-shell" v-if="product">
    <div class="product-layout">
      <div class="gallery">
        <button class="main-image-button" type="button" :aria-label="`Open ${product.name} image in lightbox`" @click="openLightbox(activeImageIndex)">
          <img :src="galleryImages[activeImageIndex]" :alt="product.name" class="main-image" />
          <span class="zoom-hint" aria-hidden="true">View image</span>
        </button>
        <div class="thumb-row" v-if="galleryImages.length > 1" aria-label="Product images">
          <button v-for="(image, index) in galleryImages" :key="image" type="button" class="thumb-button" :class="{ selected: index === activeImageIndex }" :aria-label="`Show image ${index + 1}`" @click="activeImageIndex = index">
            <img :src="image" :alt="`${product.name}, image ${index + 1}`" />
          </button>
        </div>
      </div>

      <div class="details">
        <p class="category">{{ product.category }}</p>
        <h1>{{ product.name }}</h1>
        <div class="price-block">
          <strong>{{ formatCurrency(product.salePrice || product.price) }}</strong>
          <span v-if="product.salePrice">{{ formatCurrency(product.price) }}</span>
        </div>
        <p class="sku">SKU: {{ product.sku }}</p>
        <p class="description">{{ product.description }}</p>
        <div class="stock-row">
          <span class="stock" :class="product.stock > 0 ? 'in-stock' : 'out'">
            {{ product.stock > 0 ? 'In stock' : 'Out of stock' }}
          </span>
          <span>{{ product.stock }} available</span>
        </div>

        <div class="purchase-row">
          <input v-model="quantity" type="number" min="1" max="10" />
          <button class="primary" :class="{ added: justAdded }" @click="addToCart">
            <span class="button-mark" aria-hidden="true">{{ justAdded ? '✓' : '+' }}</span>
            {{ justAdded ? `Added ${addedQuantity} to cart` : 'Add to cart' }}
          </button>
        </div>

        <button class="secondary">Buy now</button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="lightboxOpen" class="lightbox-backdrop" role="presentation" @click.self="closeLightbox">
          <section class="lightbox-dialog" role="dialog" aria-modal="true" :aria-label="`${product.name} image gallery`" @keydown.esc="closeLightbox" @keydown.left.prevent="showPrevious" @keydown.right.prevent="showNext" tabindex="-1">
            <button class="lightbox-close" type="button" aria-label="Close image viewer" @click="closeLightbox">×</button>
            <button v-if="galleryImages.length > 1" class="lightbox-arrow previous" type="button" aria-label="Previous image" @click="showPrevious">‹</button>
            <img class="lightbox-image" :src="galleryImages[activeImageIndex]" :alt="`${product.name}, image ${activeImageIndex + 1}`" />
            <button v-if="galleryImages.length > 1" class="lightbox-arrow next" type="button" aria-label="Next image" @click="showNext">›</button>
            <p class="lightbox-caption">{{ product.name }} <span v-if="galleryImages.length > 1">· {{ activeImageIndex + 1 }} / {{ galleryImages.length }}</span></p>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';

const route = useRoute();
const productStore = useProductStore();
const cartStore = useCartStore();
const quantity = ref(1);
const activeImageIndex = ref(0);
const lightboxOpen = ref(false);
const justAdded = ref(false);
const addedQuantity = ref(1);
let feedbackTimer;

const product = computed(() => productStore.getBySlug(route.params.slug));
const galleryImages = computed(() => {
  const images = [product.value?.image, ...(product.value?.gallery || [])].filter(Boolean);
  return [...new Set(images)];
});

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const addToCart = async () => {
  if (!product.value) return;
  addedQuantity.value = Math.max(1, Math.min(10, Number(quantity.value) || 1));
  await cartStore.addItem(product.value, addedQuantity.value);
  justAdded.value = true;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { justAdded.value = false; }, 1600);
};

const openLightbox = (index) => {
  activeImageIndex.value = index;
  lightboxOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  lightboxOpen.value = false;
  document.body.style.overflow = '';
};

const showPrevious = () => {
  activeImageIndex.value = (activeImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length;
};

const showNext = () => {
  activeImageIndex.value = (activeImageIndex.value + 1) % galleryImages.value.length;
};

const onLightboxKeydown = (event) => {
  if (!lightboxOpen.value) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showPrevious();
  if (event.key === 'ArrowRight') showNext();
};

watch(() => route.params.slug, () => { activeImageIndex.value = 0; closeLightbox(); });
onMounted(() => window.addEventListener('keydown', onLightboxKeydown));
onBeforeUnmount(() => {
  clearTimeout(feedbackTimer);
  window.removeEventListener('keydown', onLightboxKeydown);
  document.body.style.overflow = '';
});
</script>

<style>
.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
.product-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
}
.gallery {
  min-width: 0;
}
.main-image-button { position: relative; display: block; width: 100%; padding: 0; overflow: hidden; border: 0; border-radius: 8px; background: #e9eeeb; cursor: zoom-in; }
.main-image {
  width: 100%;
  height: 520px;
  display: block;
  object-fit: contain;
  background: #e9eeeb;
  transition: transform 240ms ease;
}
.main-image-button:hover .main-image { transform: scale(1.025); }
.zoom-hint { position: absolute; right: 0.8rem; bottom: 0.8rem; padding: 0.45rem 0.65rem; color: #fff; background: rgba(23, 38, 31, 0.78); border-radius: 4px; font-size: 0.82rem; }
.thumb-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 120px));
  gap: 0.75rem;
  margin-top: 1rem;
}
.thumb-button { padding: 0; border: 2px solid transparent; border-radius: 6px; overflow: hidden; background: #e9eeeb; cursor: pointer; }
.thumb-button.selected { border-color: #176847; }
.thumb-button img {
  width: 100%;
  height: 92px;
  display: block;
  object-fit: cover;
}
.details {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}
.category {
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.74rem;
  font-weight: 700;
}
.details h1 {
  margin: 0.4rem 0 1rem;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.05em;
}
.price-block {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}
.price-block strong {
  font-size: 2rem;
}
.price-block span {
  color: #9ca3af;
  text-decoration: line-through;
}
.sku {
  color: #6b7280;
  margin-bottom: 1rem;
}
.description {
  color: #4b5563;
  line-height: 1.7;
}
.stock-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}
.stock {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-weight: 700;
}
.stock.in-stock {
  background: #dcfce7;
  color: #166534;
}
.stock.out {
  background: #fee2e2;
  color: #991b1b;
}
.purchase-row {
  display: flex;
  gap: 0.8rem;
  margin-top: 1.2rem;
}
.purchase-row input {
  width: 90px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
}
.primary,
.secondary {
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.2rem;
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
@keyframes add-confirm { 50% { transform: scale(1.025); } }
.secondary {
  width: 100%;
  margin-top: 0.8rem;
  background: #f3f4f6;
  color: #111827;
}
.lightbox-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 1.25rem; background: rgba(9, 16, 13, 0.88); }
.lightbox-dialog { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 0.8rem; width: min(1200px, 100%); max-height: 100%; outline: none; }
.lightbox-image { grid-column: 2; width: 100%; height: min(78vh, 820px); object-fit: contain; }
.lightbox-close { position: absolute; top: -0.5rem; right: 0; z-index: 1; width: 2.6rem; height: 2.6rem; border: 1px solid rgba(255,255,255,0.35); border-radius: 50%; color: #fff; background: rgba(0,0,0,0.35); font-size: 1.8rem; line-height: 1; cursor: pointer; }
.lightbox-arrow { width: 2.8rem; height: 2.8rem; border: 1px solid rgba(255,255,255,0.35); border-radius: 50%; color: #fff; background: rgba(0,0,0,0.35); font-size: 2rem; cursor: pointer; }
.lightbox-caption { grid-column: 1 / -1; margin: 0; color: #fff; text-align: center; }
.lightbox-caption span { color: #bdc9c2; }
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 180ms ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
@media (max-width: 900px) {
  .product-layout {
    grid-template-columns: 1fr;
  }
  .main-image { height: min(65vh, 520px); }
  .lightbox-dialog { grid-template-columns: auto minmax(0, 1fr) auto; gap: 0.4rem; }
  .lightbox-arrow { width: 2.2rem; height: 2.2rem; }
}
</style>

import { defineStore } from 'pinia';
import api from '../services/api';

const fallbackProducts = [
  {
    id: 1,
    sku: 'FUR-1001',
    name: 'Modern Lounge Chair',
    slug: 'modern-lounge-chair',
    shortDescription: 'Soft upholstery and a brushed-metal frame for daily comfort.',
    description: 'A refined accent chair built for modern interiors with premium cushioning and timeless detail.',
    price: 249.99,
    salePrice: 219.99,
    category: 'Furniture',
    stock: 12,
    featured: true,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 2,
    sku: 'DEC-2002',
    name: 'Cedar Accent Table',
    slug: 'cedar-accent-table',
    shortDescription: 'Solid wood finish with a compact footprint and elegant details.',
    description: 'A compact accent table that blends utility and style in living rooms and apartments.',
    price: 179.99,
    salePrice: null,
    category: 'Home Decor',
    stock: 9,
    featured: true,
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 3,
    sku: 'LIT-3003',
    name: 'Minimal Floor Lamp',
    slug: 'minimal-floor-lamp',
    shortDescription: 'Warm lighting with a slim silhouette and matte black finish.',
    description: 'An elegant floor lamp designed to soften modern rooms without overwhelming the layout.',
    price: 129.99,
    salePrice: 109.99,
    category: 'Lighting',
    stock: 18,
    featured: false,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 4,
    sku: 'SHE-4004',
    name: 'Oak Storage Shelf',
    slug: 'oak-storage-shelf',
    shortDescription: 'A clean storage solution for living rooms, offices, and studios.',
    description: 'Functional oak shelving with strong support and a understated profile for multi-use spaces.',
    price: 269.99,
    salePrice: null,
    category: 'Storage',
    stock: 5,
    featured: true,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    ],
  },
];

const normalizeProduct = (product = {}, fallback = null) => {
  const productName = product.name || fallback?.name || 'Product';
  const centsToDollars = (amount) => Number(amount ?? 0) / 100;

  return {
    ...product,
    id: product.id,
    sku: product.sku || product.SKU || '',
    name: productName,
    slug: product.slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    shortDescription: product.shortDescription || product.short_description || fallback?.shortDescription || '',
    description: product.description || fallback?.description || '',
    price: Number(product.price ?? centsToDollars(product.price_cents ?? product.priceCents ?? fallback?.price ?? 0)),
    salePrice: product.salePrice != null ? Number(product.salePrice) : (product.sale_price_cents != null || product.salePriceCents != null
      ? Number(product.sale_price_cents ?? product.salePriceCents) / 100
      : fallback?.salePrice ?? null),
    category: product.category || product.category_name || fallback?.category || 'General',
    stock: Number(product.stock ?? product.stock_qty ?? product.stockQty ?? fallback?.stock ?? 0),
    featured: Boolean(product.featured ?? fallback?.featured ?? false),
    image: product.image || product.primary_image || product.images?.[0]?.image_url || fallback?.image || '',
    gallery: Array.isArray(product.gallery) ? product.gallery : Array.isArray(product.images)
      ? product.images.map((image) => image.image_url || image.url || image).filter(Boolean)
      : fallback?.gallery || [],
  };
};

const normalizeProductList = (payload, fallback = []) => {
  const list = payload?.items || payload?.products || payload || fallback;
  if (!Array.isArray(list)) return fallback;
  return list.map((product) => normalizeProduct(product, fallback[0] || null));
};

export const useProductStore = defineStore('product', {
  state: () => ({
    products: fallbackProducts,
    featured: fallbackProducts.filter((item) => item.featured),
    loading: false,
  }),
  actions: {
    async fetchProducts(params = {}) {
      this.loading = true;
      try {
        const { data } = await api.get('/api/products', { params }).catch(() => ({ data: { success: true, data: { items: fallbackProducts } } }));
        const list = data?.data && typeof data.data === 'object' ? normalizeProductList(data.data, fallbackProducts) : fallbackProducts;
        this.products = list.length ? list : fallbackProducts;
        return this.products;
      } finally {
        this.loading = false;
      }
    },
    async fetchFeaturedProducts() {
      try {
        const { data } = await api.get('/api/products/featured').catch(() => ({ data: { success: true, data: fallbackProducts.filter((p) => p.featured) } }));
        const list = normalizeProductList(data?.data, fallbackProducts.filter((p) => p.featured));
        this.featured = list.length ? list : fallbackProducts.filter((p) => p.featured);
        return this.featured;
      } catch (err) {
        this.featured = fallbackProducts.filter((p) => p.featured);
        return this.featured;
      }
    },
    getBySlug(slug) {
      return this.products.find((product) => product.slug === slug) || fallbackProducts.find((product) => product.slug === slug) || null;
    },
  },
});

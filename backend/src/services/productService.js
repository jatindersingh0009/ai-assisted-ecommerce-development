const pool = require('../config/db');
const { env } = require('../config/env');
const { slugify } = require('../utils/slug');

const tableName = `${env.dbPrefix}products`;
const imageTable = `${env.dbPrefix}product_images`;

const getStockStatus = (stockQty) => {
  if (stockQty <= 0) return 'out_of_stock';
  if (stockQty <= 5) return 'low_stock';
  return 'in_stock';
};

const normalizeProductData = (payload) => {
  const name = payload.name ? String(payload.name).trim() : '';
  const sku = payload.sku ? String(payload.sku).trim() : '';
  const slug = payload.slug ? String(payload.slug).trim() : slugify(name);
  const priceCents = Number(payload.price ?? payload.price_cents ?? 0) * 100;
  const salePriceCents = payload.salePrice !== undefined && payload.salePrice !== null
    ? Number(payload.salePrice) * 100
    : payload.sale_price_cents !== undefined && payload.sale_price_cents !== null
      ? Number(payload.sale_price_cents)
      : null;
  const costPriceCents = Number(payload.costPrice ?? payload.cost_price_cents ?? 0) * 100;
  const stockQty = Number(payload.stockQty ?? payload.stock_qty ?? 0);

  return {
    categoryId: payload.categoryId ? Number(payload.categoryId) : payload.category_id ? Number(payload.category_id) : null,
    brand: payload.brand ? String(payload.brand).trim() : null,
    sku,
    name,
    slug,
    shortDescription: payload.shortDescription ? String(payload.shortDescription).trim() : payload.short_description || null,
    description: payload.description ? String(payload.description).trim() : null,
    priceCents: Math.round(priceCents),
    salePriceCents: salePriceCents !== null ? Math.round(Number(salePriceCents)) : null,
    costPriceCents: Math.round(costPriceCents),
    stockQty,
    stockStatus: getStockStatus(stockQty),
    weightGrams: payload.weightGrams !== undefined ? Number(payload.weightGrams) : payload.weight_grams ? Number(payload.weight_grams) : null,
    status: payload.status || 'active',
    featured: payload.featured !== undefined ? Boolean(payload.featured) : Boolean(payload.featured_flag || false),
  };
};

const listProducts = async ({
  search = '',
  categoryId = null,
  minPrice = null,
  maxPrice = null,
  stockFilter = null,
  sort = 'newest',
  page = 1,
  limit = 12,
}) => {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];

  let whereClauses = ['status = ?'];
  params.push('active');

  if (search) {
    whereClauses.push('(name LIKE ? OR sku LIKE ? OR short_description LIKE ? OR description LIKE ? OR brand LIKE ?)');
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  if (categoryId) {
    whereClauses.push('category_id = ?');
    params.push(Number(categoryId));
  }

  if (minPrice !== null && minPrice !== '') {
    whereClauses.push('price_cents >= ?');
    params.push(Math.round(Number(minPrice) * 100));
  }

  if (maxPrice !== null && maxPrice !== '') {
    whereClauses.push('price_cents <= ?');
    params.push(Math.round(Number(maxPrice) * 100));
  }

  if (stockFilter === 'in_stock') {
    whereClauses.push('stock_qty > 0');
  }

  if (stockFilter === 'out_of_stock') {
    whereClauses.push('stock_qty = 0');
  }

  const whereSql = whereClauses.join(' AND ');

  const sortMap = {
    newest: 'created_at DESC',
    price_asc: 'price_cents ASC',
    price_desc: 'price_cents DESC',
    name_asc: 'name ASC',
    featured: 'featured DESC, created_at DESC',
  };

  const orderSql = sortMap[sort] || sortMap.newest;

  const [items] = await pool.query(
    `SELECT * FROM ${tableName} WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM ${tableName} WHERE ${whereSql}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);

  return {
    items,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.max(1, Math.ceil(total / Number(limit))),
  };
};

const getProductById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
  if (!rows[0]) return null;

  const [images] = await pool.query(
    `SELECT * FROM ${imageTable} WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [id]
  );

  return { ...rows[0], images };
};

const getProductBySlug = async (slug) => {
  const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE slug = ? LIMIT 1`, [slug]);
  if (!rows[0]) return null;

  const [images] = await pool.query(
    `SELECT * FROM ${imageTable} WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [rows[0].id]
  );

  return { ...rows[0], images };
};

const createProduct = async (payload) => {
  const data = normalizeProductData(payload);

  const [result] = await pool.query(
    `INSERT INTO ${tableName} (
      category_id, brand, sku, name, slug, short_description, description,
      price_cents, sale_price_cents, cost_price_cents, stock_qty, stock_status,
      weight_grams, status, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.categoryId,
      data.brand,
      data.sku,
      data.name,
      data.slug,
      data.shortDescription,
      data.description,
      data.priceCents,
      data.salePriceCents,
      data.costPriceCents,
      data.stockQty,
      data.stockStatus,
      data.weightGrams,
      data.status,
      data.featured ? 1 : 0,
    ]
  );

  return { id: result.insertId, ...data };
};

const updateProduct = async (id, payload) => {
  const existing = await getProductById(id);
  if (!existing) return null;

  const data = normalizeProductData({ ...existing, ...payload });

  await pool.query(
    `UPDATE ${tableName} SET
      category_id = ?, brand = ?, sku = ?, name = ?, slug = ?, short_description = ?, description = ?,
      price_cents = ?, sale_price_cents = ?, cost_price_cents = ?, stock_qty = ?, stock_status = ?,
      weight_grams = ?, status = ?, featured = ?
     WHERE id = ?`,
    [
      data.categoryId,
      data.brand,
      data.sku,
      data.name,
      data.slug,
      data.shortDescription,
      data.description,
      data.priceCents,
      data.salePriceCents,
      data.costPriceCents,
      data.stockQty,
      data.stockStatus,
      data.weightGrams,
      data.status,
      data.featured ? 1 : 0,
      id,
    ]
  );

  return { ...existing, ...data };
};

const deleteProduct = async (id) => {
  const [result] = await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const getFeaturedProducts = async (limit = 8) => {
  const [rows] = await pool.query(
    `SELECT * FROM ${tableName} WHERE status = 'active' AND featured = 1 ORDER BY created_at DESC LIMIT ?`,
    [Number(limit)]
  );
  return rows;
};

module.exports = {
  listProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getStockStatus,
  normalizeProductData,
};

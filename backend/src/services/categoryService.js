const pool = require('../config/db');
const { env } = require('../config/env');
const { slugify } = require('../utils/slug');

const tableName = `${env.dbPrefix}categories`;

const normalizeCategoryData = (payload) => {
  const name = payload.name ? String(payload.name).trim() : '';
  const slug = payload.slug ? String(payload.slug).trim() : slugify(name);

  return {
    parentId: payload.parentId ? Number(payload.parentId) : null,
    name,
    slug,
    description: payload.description ? String(payload.description).trim() : null,
    image: payload.image ? String(payload.image).trim() : null,
    status: payload.status || 'active',
    sortOrder: payload.sortOrder !== undefined ? Number(payload.sortOrder) : 0,
  };
};

const getAllCategories = async () => {
  const [rows] = await pool.query(`SELECT * FROM ${tableName} ORDER BY sort_order ASC, id ASC`);
  return rows;
};

const getCategoryTree = async () => {
  const categories = await getAllCategories();
  const map = new Map();
  const roots = [];

  categories.forEach((category) => {
    category.children = [];
    map.set(category.id, category);
  });

  categories.forEach((category) => {
    if (category.parent_id) {
      const parent = map.get(category.parent_id);
      if (parent) {
        parent.children.push(category);
      }
    } else {
      roots.push(category);
    }
  });

  return roots;
};

const getCategoryById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const createCategory = async (payload) => {
  const data = normalizeCategoryData(payload);

  const [result] = await pool.query(
    `INSERT INTO ${tableName} (parent_id, name, slug, description, image, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.parentId, data.name, data.slug, data.description, data.image, data.status, data.sortOrder]
  );

  return { id: result.insertId, ...data };
};

const updateCategory = async (id, payload) => {
  const existing = await getCategoryById(id);

  if (!existing) {
    return null;
  }

  const data = normalizeCategoryData({ ...existing, ...payload });

  await pool.query(
    `UPDATE ${tableName} SET parent_id = ?, name = ?, slug = ?, description = ?, image = ?, status = ?, sort_order = ? WHERE id = ?`,
    [data.parentId, data.name, data.slug, data.description, data.image, data.status, data.sortOrder, id]
  );

  return { ...existing, ...data };
};

const deleteCategory = async (id) => {
  const [result] = await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllCategories,
  getCategoryTree,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

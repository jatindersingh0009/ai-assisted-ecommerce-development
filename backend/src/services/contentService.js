const pool = require('../config/db');
const { env } = require('../config/env');
const { slugify } = require('../utils/slug');

const prefix = env.dbPrefix;

const listItems = async (type) => {
  const [items] = await pool.query(
    `SELECT i.*, c.name AS category_name, u.first_name AS author_first_name, u.last_name AS author_last_name
     FROM ${prefix}content_items i LEFT JOIN ${prefix}content_categories c ON c.id = i.category_id
     LEFT JOIN ${prefix}users u ON u.id = i.author_id WHERE i.type = ? ORDER BY i.updated_at DESC, i.id DESC`,
    [type]
  );
  for (const item of items) {
    const [tags] = await pool.query(
      `SELECT t.id, t.name, t.slug FROM ${prefix}content_tags t
       JOIN ${prefix}content_item_tags it ON it.tag_id = t.id WHERE it.content_item_id = ?`,
      [item.id]
    );
    item.tags = tags;
  }
  return items;
};

const saveItem = async (type, payload, authorId, id = null) => {
  const title = String(payload.title || '').trim();
  const slug = slugify(String(payload.slug || title));
  const body = String(payload.body || '');
  const status = payload.status || 'draft';
  if (!title || !slug || !body || !['draft', 'published', 'archived'].includes(status)) {
    const error = new Error('Title, body, and valid status are required');
    error.statusCode = 422;
    throw error;
  }
  const categoryId = payload.categoryId ? Number(payload.categoryId) : null;
  const tagIds = [...new Set((Array.isArray(payload.tagIds) ? payload.tagIds : []).map(Number).filter(Number.isInteger))];
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let itemId = id;
    if (id) {
      const [result] = await connection.query(
        `UPDATE ${prefix}content_items SET category_id = ?, title = ?, slug = ?, excerpt = ?, body = ?, status = ?,
         published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, NOW()) ELSE NULL END WHERE id = ? AND type = ?`,
        [categoryId, title, slug, payload.excerpt || null, body, status, status, id, type]
      );
      if (!result.affectedRows) {
        const error = new Error(`${type} not found`);
        error.statusCode = 404;
        throw error;
      }
    } else {
      const [result] = await connection.query(
        `INSERT INTO ${prefix}content_items (type, category_id, author_id, title, slug, excerpt, body, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, IF(? = 'published', NOW(), NULL))`,
        [type, categoryId, authorId, title, slug, payload.excerpt || null, body, status, status]
      );
      itemId = result.insertId;
    }
    await connection.query(`DELETE FROM ${prefix}content_item_tags WHERE content_item_id = ?`, [itemId]);
    for (const tagId of tagIds) {
      await connection.query(`INSERT INTO ${prefix}content_item_tags (content_item_id, tag_id) VALUES (?, ?)`, [itemId, tagId]);
    }
    await connection.commit();
    return itemId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteItem = async (id, type) => {
  const [result] = await pool.query(`DELETE FROM ${prefix}content_items WHERE id = ? AND type = ?`, [id, type]);
  return result.affectedRows > 0;
};

const getCategories = async () => {
  const [rows] = await pool.query(`SELECT * FROM ${prefix}content_categories ORDER BY name`);
  return rows;
};

const saveCategory = async (payload, id = null) => {
  const name = String(payload.name || '').trim();
  if (!name) {
    const error = new Error('Category name is required');
    error.statusCode = 422;
    throw error;
  }
  const slug = slugify(String(payload.slug || name));
  if (id) {
    const [result] = await pool.query(`UPDATE ${prefix}content_categories SET name = ?, slug = ?, description = ? WHERE id = ?`, [name, slug, payload.description || null, id]);
    return result.affectedRows ? Number(id) : null;
  }
  const [result] = await pool.query(`INSERT INTO ${prefix}content_categories (name, slug, description) VALUES (?, ?, ?)`, [name, slug, payload.description || null]);
  return result.insertId;
};

const deleteCategory = async (id) => {
  const [result] = await pool.query(`DELETE FROM ${prefix}content_categories WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const getTags = async () => {
  const [rows] = await pool.query(`SELECT * FROM ${prefix}content_tags ORDER BY name`);
  return rows;
};

const saveTag = async (payload, id = null) => {
  const name = String(payload.name || '').trim();
  if (!name) {
    const error = new Error('Tag name is required');
    error.statusCode = 422;
    throw error;
  }
  const slug = slugify(String(payload.slug || name));
  if (id) {
    const [result] = await pool.query(`UPDATE ${prefix}content_tags SET name = ?, slug = ? WHERE id = ?`, [name, slug, id]);
    return result.affectedRows ? Number(id) : null;
  }
  const [result] = await pool.query(`INSERT INTO ${prefix}content_tags (name, slug) VALUES (?, ?)`, [name, slug]);
  return result.insertId;
};

const deleteTag = async (id) => {
  const [result] = await pool.query(`DELETE FROM ${prefix}content_tags WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = { listItems, saveItem, deleteItem, getCategories, saveCategory, deleteCategory, getTags, saveTag, deleteTag };
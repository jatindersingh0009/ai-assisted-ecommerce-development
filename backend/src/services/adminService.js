const { centsToDollars } = require('../utils/slug');
const pool = require('../config/db');
const { env } = require('../config/env');
const categoryService = require('./categoryService');

const storeSettingKeys = ['tax_rate', 'shipping_default_price_cents', 'cod_fee_cents', 'currency'];
const permissionKeys = [
  'dashboard.view', 'products.view', 'products.create', 'products.edit', 'products.delete',
  'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
  'orders.view', 'orders.edit', 'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
  'users.view', 'users.create', 'users.edit', 'users.delete', 'settings.view', 'settings.edit',
  'payment_gateways.view', 'payment_gateways.edit', 'content.view', 'content.create', 'content.edit', 'content.delete',
];

const isAdminRole = (role) => String(role || '').toLowerCase() === 'admin';

const buildDashboardSummary = ({
  totalSalesCents = 0,
  totalOrders = 0,
  pendingOrders = 0,
  completedOrders = 0,
  totalCustomers = 0,
  totalProducts = 0,
}) => ({
  totalSales: centsToDollars(totalSalesCents),
  totalOrders: Number(totalOrders || 0),
  pendingOrders: Number(pendingOrders || 0),
  completedOrders: Number(completedOrders || 0),
  totalCustomers: Number(totalCustomers || 0),
  totalProducts: Number(totalProducts || 0),
});

const getDashboardSummary = async () => {
  const prefix = env.dbPrefix;
  const [[sales]] = await pool.query(
    `SELECT COUNT(*) AS total_orders,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN grand_total_cents ELSE 0 END), 0) AS total_sales_cents,
            SUM(order_status = 'pending') AS pending_orders,
            SUM(order_status IN ('delivered', 'shipped')) AS completed_orders
     FROM ${prefix}orders`
  );
  const [[counts]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM ${prefix}users WHERE role = 'customer') AS total_customers,
            (SELECT COUNT(*) FROM ${prefix}products) AS total_products`
  );

  return buildDashboardSummary({
    totalSalesCents: sales.total_sales_cents,
    totalOrders: sales.total_orders,
    pendingOrders: sales.pending_orders,
    completedOrders: sales.completed_orders,
    totalCustomers: counts.total_customers,
    totalProducts: counts.total_products,
  });
};

const getAdminProducts = async () => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category
     FROM ${env.dbPrefix}products p
     LEFT JOIN ${env.dbPrefix}categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC, p.id DESC`
  );
  return rows;
};

const getAdminOrders = async (limit = 5) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.order_number, o.user_id, o.grand_total_cents, o.currency,
            o.payment_status, o.order_status, o.created_at,
            u.first_name, u.last_name, u.email
     FROM ${env.dbPrefix}orders o
     JOIN ${env.dbPrefix}users u ON u.id = o.user_id
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ?`,
    [Math.min(Math.max(Number(limit) || 5, 1), 50)]
  );
  return rows;
};

const getAdminOrderById = async (id) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.order_number, o.user_id, o.grand_total_cents, o.currency,
            o.payment_method, o.payment_status, o.order_status, o.created_at,
            u.first_name, u.last_name, u.email
     FROM ${env.dbPrefix}orders o JOIN ${env.dbPrefix}users u ON u.id = o.user_id
     WHERE o.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  const [items] = await pool.query(`SELECT * FROM ${env.dbPrefix}order_items WHERE order_id = ?`, [id]);
  return { ...rows[0], items };
};

const getCustomers = async () => {
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, status, created_at
     FROM ${env.dbPrefix}users WHERE role = 'customer' ORDER BY created_at DESC`
  );
  return rows;
};

const getCustomerById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, status, created_at
     FROM ${env.dbPrefix}users WHERE role = 'customer' AND id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  const [addresses] = await pool.query(
    `SELECT id, type, first_name, last_name, address_1, city, state, postal_code, country
     FROM ${env.dbPrefix}addresses WHERE user_id = ? ORDER BY created_at DESC`,
    [id]
  );
  return { ...rows[0], addresses };
};

const getManagedUsers = async (requesterRole) => {
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, role, status, permissions, created_at
     FROM ${env.dbPrefix}users ${requesterRole === 'super_admin' ? '' : "WHERE role = 'customer'"}
     ORDER BY created_at DESC, id DESC`
  );
  return rows.map((row) => ({ ...row, permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions || {} }));
};

const createManagedUser = async ({ firstName, lastName, email, password, role, permissions }) => {
  const authService = require('./authService');
  return authService.createUser({ firstName, lastName, email, password, role, permissions });
};

const updateManagedUser = async (id, { firstName, lastName, email, role, status, permissions }) => {
  const [result] = await pool.query(
    `UPDATE ${env.dbPrefix}users SET first_name = ?, last_name = ?, email = ?, role = ?, status = ?, permissions = ? WHERE id = ?`,
    [firstName, lastName, email.trim().toLowerCase(), role, status, permissions ? JSON.stringify(permissions) : null, id]
  );
  return result.affectedRows > 0;
};

const deleteManagedUser = async (id, allowAdmin = false) => {
  const roleClause = allowAdmin ? "role IN ('customer', 'admin')" : "role = 'customer'";
  const [result] = await pool.query(`DELETE FROM ${env.dbPrefix}users WHERE id = ? AND ${roleClause}`, [id]);
  return result.affectedRows > 0;
};

const updateCustomerStatus = async (id, status) => {
  if (!['active', 'disabled'].includes(status)) {
    const error = new Error('Customer status must be active or disabled');
    error.statusCode = 422;
    throw error;
  }
  const [result] = await pool.query(`UPDATE ${env.dbPrefix}users SET status = ? WHERE id = ? AND role = 'customer'`, [status, id]);
  if (result.affectedRows) return true;
  const [rows] = await pool.query(`SELECT id FROM ${env.dbPrefix}users WHERE id = ? AND role = 'customer'`, [id]);
  return Boolean(rows[0]);
};

const updateOrderStatus = async (id, orderStatus) => {
  const [rows] = await pool.query(`SELECT id FROM ${env.dbPrefix}orders WHERE id = ? LIMIT 1`, [id]);
  if (!rows[0]) return false;
  await pool.query(
    `UPDATE ${env.dbPrefix}orders SET order_status = ? WHERE id = ?`,
    [orderStatus, id]
  );
  return true;
};

const getStoreSettings = async () => {
  const [rows] = await pool.query(
    `SELECT key_name, value FROM ${env.dbPrefix}settings WHERE key_name IN (?, ?, ?, ?)`,
    storeSettingKeys
  );
  return Object.fromEntries(rows.map((row) => [row.key_name, row.value]));
};

const updateStoreSettings = async (settings) => {
  const entries = Object.entries(settings || {});
  if (!entries.length || entries.some(([key, value]) => {
    if (!storeSettingKeys.includes(key) || typeof value !== 'string' || !value.trim()) return true;
    if (key === 'currency') return !/^[A-Za-z]{3,10}$/.test(value.trim());
    if (key === 'tax_rate') return !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1;
    return !Number.isInteger(Number(value)) || Number(value) < 0;
  })) {
    const error = new Error('Provide valid values for supported store settings');
    error.statusCode = 422;
    throw error;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const [key, value] of entries) {
      await connection.query(
        `INSERT INTO ${env.dbPrefix}settings (key_name, value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [key, value.trim()]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getStoreSettings();
};

module.exports = {
  isAdminRole,
  buildDashboardSummary,
  getDashboardSummary,
  getAdminProducts,
  getAdminOrders,
  getAdminOrderById,
  getCustomers,
  getCustomerById,
  updateOrderStatus,
  getStoreSettings,
  updateStoreSettings,
  permissionKeys,
  getManagedUsers,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  updateCustomerStatus,
  getAdminCategories: categoryService.getAllCategories,
  createAdminCategory: categoryService.createCategory,
  updateAdminCategory: categoryService.updateCategory,
  deleteAdminCategory: categoryService.deleteCategory,
};

const pool = require('../config/db');
const { env } = require('../config/env');

const cartTable = `${env.dbPrefix}carts`;
const cartItemTable = `${env.dbPrefix}cart_items`;
const productTable = `${env.dbPrefix}products`;

const getOrCreateCart = async ({ userId = null, sessionToken = null }) => {
  if (userId) {
    const [rows] = await pool.query(`SELECT * FROM ${cartTable} WHERE user_id = ? LIMIT 1`, [userId]);
    if (rows[0]) return rows[0];
  }

  if (sessionToken) {
    const [rows] = await pool.query(`SELECT * FROM ${cartTable} WHERE session_token = ? LIMIT 1`, [sessionToken]);
    if (rows[0]) return rows[0];
  }

  const [result] = await pool.query(
    `INSERT INTO ${cartTable} (user_id, session_token) VALUES (?, ?)`,
    [userId, sessionToken]
  );

  return { id: result.insertId, user_id: userId, session_token: sessionToken };
};

const getCartItems = async (cartId) => {
  const [rows] = await pool.query(
    `SELECT ci.*, p.name, p.slug, p.price_cents, p.stock_qty, p.status
     FROM ${cartItemTable} ci
     LEFT JOIN ${productTable} p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at DESC`,
    [cartId]
  );

  return rows;
};

const addItemToCart = async ({ userId, sessionToken, productId, quantity = 1 }) => {
  const cart = await getOrCreateCart({ userId, sessionToken });
  const productIdNumber = Number(productId);
  const quantityNumber = Number(quantity) || 1;

  const [productRows] = await pool.query(`SELECT * FROM ${productTable} WHERE id = ? LIMIT 1`, [productIdNumber]);
  if (!productRows[0]) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (productRows[0].stock_qty < quantityNumber) {
    const error = new Error('Requested quantity exceeds available stock');
    error.statusCode = 422;
    throw error;
  }

  const [existingRows] = await pool.query(
    `SELECT * FROM ${cartItemTable} WHERE cart_id = ? AND product_id = ? LIMIT 1`,
    [cart.id, productIdNumber]
  );

  if (existingRows[0]) {
    const newQty = Number(existingRows[0].quantity) + quantityNumber;
    const [updated] = await pool.query(
      `UPDATE ${cartItemTable} SET quantity = ?, price_snapshot_cents = ? WHERE id = ?`,
      [newQty, Number(productRows[0].price_cents), existingRows[0].id]
    );

    return { cartId: cart.id, itemId: existingRows[0].id, quantity: newQty, updated };
  }

  const [result] = await pool.query(
    `INSERT INTO ${cartItemTable} (cart_id, product_id, quantity, price_snapshot_cents)
     VALUES (?, ?, ?, ?)`,
    [cart.id, productIdNumber, quantityNumber, Number(productRows[0].price_cents)]
  );

  return { cartId: cart.id, itemId: result.insertId, quantity: quantityNumber };
};

const updateCartItemQuantity = async ({ cartId, itemId, quantity }) => {
  const newQty = Number(quantity);
  if (newQty <= 0) {
    return removeCartItem({ cartId, itemId });
  }

  const [result] = await pool.query(
    `UPDATE ${cartItemTable} SET quantity = ? WHERE id = ? AND cart_id = ?`,
    [newQty, itemId, cartId]
  );

  return result.affectedRows > 0;
};

const removeCartItem = async ({ cartId, itemId }) => {
  const [result] = await pool.query(`DELETE FROM ${cartItemTable} WHERE id = ? AND cart_id = ?`, [itemId, cartId]);
  return result.affectedRows > 0;
};

const clearCart = async (cartId) => {
  const [result] = await pool.query(`DELETE FROM ${cartItemTable} WHERE cart_id = ?`, [cartId]);
  return result.affectedRows >= 0;
};

module.exports = {
  getOrCreateCart,
  getCartItems,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};

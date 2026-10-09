const { getPaymentMethodFee } = require('./checkoutService');
const pool = require('../config/db');
const { env } = require('../config/env');
const paymentGatewayService = require('./paymentGatewayService');

const validateStockAvailability = (items = []) => {
  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    const stockQty = Number(item.stockQty || 0);

    if (quantity > stockQty) {
      return {
        isValid: false,
        message: `Insufficient stock for product ${item.productId}`,
      };
    }
  }

  return {
    isValid: true,
    message: 'Stock is available',
  };
};

const calculateOrderSnapshot = ({
  items = [],
  shippingCostCents = 0,
  discountCents = 0,
  taxRate = 0.08,
  codFeeCents = 0,
}) => {
  const itemSnapshots = items.map((item) => {
    const priceCents = Number(item.priceCents || item.price || 0);
    const quantity = Number(item.quantity || 1);
    const subtotalCents = priceCents * quantity;

    return {
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      priceCents,
      quantity,
      subtotalCents,
    };
  });

  const subtotalCents = itemSnapshots.reduce((sum, item) => sum + item.subtotalCents, 0);
  const discount = Number(discountCents || 0);
  const shipping = Number(shippingCostCents || 0);
  const taxBase = Math.max(0, subtotalCents - discount);
  const taxCents = Math.round(taxBase * Number(taxRate || 0));
  const codFee = Number(codFeeCents || 0);
  const grandTotalCents = subtotalCents - discount + shipping + taxCents + codFee;

  return {
    subtotalCents,
    discountCents: discount,
    shippingCostCents: shipping,
    taxCents,
    codFeeCents: codFee,
    grandTotalCents,
    items: itemSnapshots,
  };
};

const buildOrderNumber = () => {
  const now = new Date();
  const yymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `CE-${yymmdd}-${randomSuffix}`;
};

const createOrderFromCart = ({
  userId,
  items,
  shippingAddressId,
  billingAddressId,
  paymentMethod,
  shippingCostCents = 0,
  discountCents = 0,
  taxRate = 0.08,
}) => {
  const codFeeCents = getPaymentMethodFee(paymentMethod);
  const snapshot = calculateOrderSnapshot({
    items,
    shippingCostCents,
    discountCents,
    taxRate,
    codFeeCents,
  });

  return {
    orderNumber: buildOrderNumber(),
    userId,
    shippingAddressId,
    billingAddressId,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    orderStatus: 'pending',
    ...snapshot,
  };
};

const createOrderInDatabase = async ({
  userId,
  items,
  customer,
  billingAddressId: selectedBillingAddressId = null,
  shippingAddressId: selectedShippingAddressId = null,
  shippingCustomer = null,
  shippingSameAsBilling = true,
  paymentMethod,
  shippingCostCents = 0,
  discountCents = 0,
  taxRate = 0.08,
}) => {
  await paymentGatewayService.assertGatewayEnabled(paymentMethod);
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Cart is empty');
    error.statusCode = 400;
    throw error;
  }
  if (!customer?.email || (!selectedBillingAddressId && (!customer?.firstName || !customer?.lastName || !customer?.address || !customer?.city || !customer?.zip))) {
    const error = new Error('Complete shipping details are required');
    error.statusCode = 422;
    throw error;
  }
  if (!['cod', 'stripe', 'paypal'].includes(paymentMethod)) {
    const error = new Error('Invalid payment method');
    error.statusCode = 422;
    throw error;
  }
  if (!shippingSameAsBilling && !selectedShippingAddressId
      && (!shippingCustomer?.firstName || !shippingCustomer?.lastName || !shippingCustomer?.address || !shippingCustomer?.city || !shippingCustomer?.zip)) {
    const error = new Error('Complete the alternate shipping address');
    error.statusCode = 422;
    throw error;
  }
  const connection = await pool.getConnection();
  const prefix = env.dbPrefix;
  try {
    await connection.beginTransaction();
    const productIds = [...new Set(items.map((item) => Number(item.productId)).filter(Number.isInteger))];
    if (productIds.length !== items.length) {
      const error = new Error('Invalid product in cart');
      error.statusCode = 422;
      throw error;
    }
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await connection.query(
      `SELECT id, name, sku, price_cents, sale_price_cents, stock_qty
       FROM ${prefix}products WHERE id IN (${placeholders}) AND status = 'active' FOR UPDATE`,
      productIds
    );
    const productMap = new Map(products.map((product) => [Number(product.id), product]));
    const snapshots = items.map((item) => {
      const product = productMap.get(Number(item.productId));
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        const error = new Error(`Invalid product or quantity for product ${item.productId}`);
        error.statusCode = 422;
        throw error;
      }
      if (quantity > Number(product.stock_qty)) {
        const error = new Error(`Insufficient stock for product ${item.productId}`);
        error.statusCode = 422;
        throw error;
      }
      const priceCents = product.sale_price_cents ?? product.price_cents;
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        priceCents: Number(priceCents),
        quantity,
        subtotalCents: Number(priceCents) * quantity,
      };
    });

    const [userRows] = await connection.query(`SELECT id FROM ${prefix}users WHERE id = ? FOR UPDATE`, [userId]);
    if (!userRows[0]) {
      const error = new Error('Customer account not found');
      error.statusCode = 401;
      throw error;
    }

    const insertAddress = async (type, details) => {
      const [result] = await connection.query(
        `INSERT INTO ${prefix}addresses
          (user_id, type, first_name, last_name, address_1, address_2, city, state, postal_code, country, phone, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [userId, type, details.firstName.trim(), details.lastName.trim(), details.address.trim(), details.address2 || null,
          details.city.trim(), details.state || null, details.zip.trim(), details.country || 'US', details.phone || null]
      );
      return result.insertId;
    };
    const getOwnedAddressId = async (addressId) => {
      if (!addressId) return null;
      const [rows] = await connection.query(
        `SELECT id FROM ${prefix}addresses WHERE id = ? AND user_id = ? LIMIT 1 FOR UPDATE`,
        [addressId, userId]
      );
      if (!rows[0]) {
        const error = new Error('Selected address was not found on your account');
        error.statusCode = 422;
        throw error;
      }
      return rows[0].id;
    };
    const billingAddressId = await getOwnedAddressId(selectedBillingAddressId)
      || await insertAddress('billing', customer);
    let shippingAddressId;
    if (shippingSameAsBilling !== false) {
      shippingAddressId = billingAddressId;
    } else {
      shippingAddressId = await getOwnedAddressId(selectedShippingAddressId)
        || await insertAddress('shipping', shippingCustomer);
    }
    const order = createOrderFromCart({
      userId,
      items: snapshots,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      shippingCostCents,
      discountCents,
      taxRate,
    });

    const [orderResult] = await connection.query(
      `INSERT INTO ${prefix}orders
        (order_number, user_id, billing_address_id, shipping_address_id, subtotal_cents, discount_cents,
         shipping_cost_cents, tax_cents, cod_fee_cents, grand_total_cents, payment_method, payment_status, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.orderNumber, userId, billingAddressId, shippingAddressId, order.subtotalCents, order.discountCents,
        order.shippingCostCents, order.taxCents, order.codFeeCents, order.grandTotalCents,
        paymentMethod, order.paymentStatus, order.orderStatus]
    );
    for (const item of snapshots) {
      await connection.query(
        `INSERT INTO ${prefix}order_items (order_id, product_id, product_name, sku, price_cents, quantity, subtotal_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.productId, item.productName, item.sku, item.priceCents, item.quantity, item.subtotalCents]
      );
      await connection.query(
        `UPDATE ${prefix}products SET stock_qty = stock_qty - ?,
          stock_status = CASE WHEN stock_qty - ? <= 0 THEN 'out_of_stock' WHEN stock_qty - ? <= 5 THEN 'low_stock' ELSE 'in_stock' END
         WHERE id = ?`,
        [item.quantity, item.quantity, item.quantity, item.productId]
      );
    }
    await connection.query(
      `INSERT INTO ${prefix}payments (order_id, user_id, gateway, amount_cents, fee_cents, status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderResult.insertId, userId, paymentMethod, order.grandTotalCents, order.codFeeCents, order.paymentStatus, paymentMethod]
    );
    await connection.commit();
    return { ...order, id: orderResult.insertId, shippingAddressId, billingAddressId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getOrdersForUser = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, order_number AS orderNumber, grand_total_cents AS grandTotalCents,
            payment_method AS paymentMethod, payment_status AS paymentStatus,
            order_status AS orderStatus, created_at AS createdAt
     FROM ${env.dbPrefix}orders WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
    [userId]
  );
  return rows;
};

const getOrderForUser = async (userId, id) => {
  const [rows] = await pool.query(
    `SELECT * FROM ${env.dbPrefix}orders WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );
  if (!rows[0]) return null;
  const [items] = await pool.query(`SELECT * FROM ${env.dbPrefix}order_items WHERE order_id = ?`, [id]);
  return { ...rows[0], items };
};

const getAddressesForUser = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, type, first_name AS firstName, last_name AS lastName,
            address_1 AS address, city, postal_code AS zip, country
     FROM ${env.dbPrefix}addresses WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

module.exports = {
  validateStockAvailability,
  calculateOrderSnapshot,
  buildOrderNumber,
  createOrderFromCart,
  createOrderInDatabase,
  getOrdersForUser,
  getOrderForUser,
  getAddressesForUser,
};

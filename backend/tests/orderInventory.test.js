const test = require('node:test');
const assert = require('node:assert/strict');

const { validateStockAvailability, calculateOrderSnapshot } = require('../src/services/orderService');

test('validateStockAvailability rejects purchases above available inventory', () => {
  const result = validateStockAvailability([
    { productId: 1, quantity: 4, stockQty: 3 }
  ]);

  assert.equal(result.isValid, false);
  assert.equal(result.message, 'Insufficient stock for product 1');
});

test('calculateOrderSnapshot preserves historical item data and totals', () => {
  const snapshot = calculateOrderSnapshot({
    items: [
      { productId: 1, productName: 'Desk Chair', sku: 'CHAIR-001', priceCents: 5000, quantity: 2 },
      { productId: 2, productName: 'Lamp', sku: 'LAMP-001', priceCents: 1500, quantity: 1 }
    ],
    shippingCostCents: 1200,
    discountCents: 500,
    taxRate: 0.08,
    codFeeCents: 1000,
  });

  assert.equal(snapshot.subtotalCents, 11500);
  assert.equal(snapshot.taxCents, 880);
  assert.equal(snapshot.grandTotalCents, 14080);
  assert.equal(snapshot.items[0].productName, 'Desk Chair');
  assert.equal(snapshot.items[0].subtotalCents, 10000);
});

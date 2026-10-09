const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateCartTotals, getPaymentMethodFee } = require('../src/services/checkoutService');

test('calculateCartTotals adds the correct subtotal, tax, shipping, discount, and COD fee', () => {
  const totals = calculateCartTotals({
    items: [
      { priceCents: 2500, quantity: 2 },
      { priceCents: 4000, quantity: 1 },
    ],
    discountCents: 500,
    shippingCostCents: 1000,
    taxRate: 0.08,
    codFeeCents: 1000,
  });

  assert.equal(totals.subtotalCents, 9000);
  assert.equal(totals.discountCents, 500);
  assert.equal(totals.shippingCostCents, 1000);
  assert.equal(totals.taxCents, 680);
  assert.equal(totals.codFeeCents, 1000);
  assert.equal(totals.grandTotalCents, 11180);
});

test('getPaymentMethodFee returns a COD fee of 1000 cents', () => {
  const fee = getPaymentMethodFee('cod');
  assert.equal(fee, 1000);
});

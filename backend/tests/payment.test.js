const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildStripeIntentPayload,
  buildPayPalOrderPayload,
  verifyPayPalCapture,
  isPaymentAmountValid,
} = require('../src/services/paymentService');

test('buildStripeIntentPayload returns a backend-safe payment intent payload', () => {
  const payload = buildStripeIntentPayload({
    amountCents: 12500,
    currency: 'USD',
    orderId: 42,
  });

  assert.equal(payload.amount, 12500);
  assert.equal(payload.currency, 'USD');
  assert.equal(payload.metadata.orderId, '42');
});

test('buildPayPalOrderPayload returns a valid PayPal order request', () => {
  const payload = buildPayPalOrderPayload({
    amountCents: 12500,
    currency: 'USD',
    orderId: 'ce-42',
  });

  assert.equal(payload.intent, 'CAPTURE');
  assert.equal(payload.purchase_units[0].amount.value, '125.00');
  assert.equal(payload.purchase_units[0].reference_id, 'ce-42');
});

test('verifyPayPalCapture validates the exact expected amount', () => {
  const result = verifyPayPalCapture({
    expectedTotalCents: 5000,
    captureData: {
      status: 'COMPLETED',
      purchase_units: [{ amount: { value: '50.00', currency_code: 'USD' } }],
    },
  });

  assert.equal(result.isValid, true);
});

test('isPaymentAmountValid rejects mismatched totals', () => {
  const result = isPaymentAmountValid({
    expectedTotalCents: 1000,
    actualTotalCents: 1500,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.message, 'Payment amount mismatch');
});

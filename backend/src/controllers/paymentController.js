const { sendSuccess, sendError } = require('../utils/response');
const {
  buildStripeIntentPayload,
  createStripeIntent: createStripePaymentIntent,
  createPayPalOrder: createPayPalPaymentOrder,
  isPaymentAmountValid,
  verifyPayPalCapture,
  verifyStripeEvent,
} = require('../services/paymentService');
const paymentGatewayService = require('../services/paymentGatewayService');

const createStripeIntent = async (req, res) => {
  try {
    await paymentGatewayService.assertGatewayEnabled('stripe');
    const { amountCents, currency = 'USD', orderId } = req.body;
    const payload = await createStripePaymentIntent({ amountCents, currency, orderId });

    return sendSuccess(res, 200, 'Stripe payment intent created', payload);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Unable to create Stripe payment intent');
  }
};

const confirmStripePayment = async (req, res) => {
  try {
    await paymentGatewayService.assertGatewayEnabled('stripe');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
  return sendSuccess(res, 200, 'Stripe payment confirmation received', {
    status: 'received',
    ...req.body,
  });
};

const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const result = await verifyStripeEvent({
    rawBody: req.body,
    signature,
    secret,
  });

  if (!result.valid) {
    return sendError(res, 400, 'Invalid Stripe webhook signature', { reason: result.reason });
  }

  return sendSuccess(res, 200, 'Stripe webhook processed', { type: result.event.type });
};

const createPayPalOrder = async (req, res) => {
  const { amountCents, currency = 'USD', orderId } = req.body;

  if (!amountCents) {
    return sendError(res, 400, 'Payment amount is required');
  }

  try {
    await paymentGatewayService.assertGatewayEnabled('paypal');
    const payload = await createPayPalPaymentOrder({ amountCents, currency, orderId });
    return sendSuccess(res, 200, 'PayPal order created', payload);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Unable to create PayPal order');
  }
};

const capturePayPalOrder = async (req, res) => {
  try {
    await paymentGatewayService.assertGatewayEnabled('paypal');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
  const { expectedTotalCents, captureData } = req.body;
  const result = verifyPayPalCapture({ expectedTotalCents, captureData });

  if (!result.isValid) {
    return sendError(res, 400, result.message, result);
  }

  return sendSuccess(res, 200, 'PayPal payment captured', result);
};

const validatePaymentAmount = (req, res) => {
  const result = isPaymentAmountValid({
    expectedTotalCents: req.body.expectedTotalCents,
    actualTotalCents: req.body.actualTotalCents,
  });

  if (!result.isValid) {
    return sendError(res, 400, result.message, result);
  }

  return sendSuccess(res, 200, 'Payment amount verified', result);
};

module.exports = {
  createStripeIntent,
  confirmStripePayment,
  handleStripeWebhook,
  createPayPalOrder,
  capturePayPalOrder,
  validatePaymentAmount,
};

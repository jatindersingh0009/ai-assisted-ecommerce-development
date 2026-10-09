const { sendSuccess, sendError } = require('../utils/response');
const { calculateCartTotals, getPaymentMethodFee } = require('../services/checkoutService');
const paymentGatewayService = require('../services/paymentGatewayService');

const getPaymentMethods = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Available payment methods retrieved successfully', await paymentGatewayService.getGatewaySettings());
  } catch (error) {
    return next(error);
  }
};

const validateCart = async (req, res, next) => {
  const { items = [], discountCents = 0, shippingCostCents = 0, paymentMethod = 'cod', taxRate = 0.08 } = req.body;

  try {
    await paymentGatewayService.assertGatewayEnabled(paymentMethod);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }

  const totals = calculateCartTotals({
    items,
    discountCents,
    shippingCostCents,
    taxRate,
    codFeeCents: getPaymentMethodFee(paymentMethod),
  });

  if (!Array.isArray(items) || items.length === 0) {
    return sendError(res, 400, 'Cart is empty');
  }

  return sendSuccess(res, 200, 'Cart validated successfully', totals);
};

const calculateTotals = async (req, res, next) => {
  const { items = [], discountCents = 0, shippingCostCents = 0, paymentMethod = 'cod', taxRate = 0.08 } = req.body;

  try {
    await paymentGatewayService.assertGatewayEnabled(paymentMethod);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }

  const totals = calculateCartTotals({
    items,
    discountCents,
    shippingCostCents,
    taxRate,
    codFeeCents: getPaymentMethodFee(paymentMethod),
  });

  return sendSuccess(res, 200, 'Totals calculated successfully', totals);
};

module.exports = {
  validateCart,
  calculateTotals,
  getPaymentMethods,
};

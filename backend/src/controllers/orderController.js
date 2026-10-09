const { sendSuccess, sendError } = require('../utils/response');
const orderService = require('../services/orderService');
const addressService = require('../services/addressService');

const createOrder = async (req, res, next) => {
  try {
    const { items = [], paymentMethod = 'cod', shippingCostCents = 0, discountCents = 0, taxRate = 0.08 } = req.body;
    const order = await orderService.createOrderInDatabase({
      userId: req.user.id,
      items,
      customer: req.body.customer,
      billingAddressId: req.body.billingAddressId || null,
      shippingAddressId: req.body.shippingAddressId || null,
      shippingCustomer: req.body.shippingCustomer || null,
      shippingSameAsBilling: req.body.shippingSameAsBilling !== false,
      paymentMethod,
      shippingCostCents,
      discountCents,
      taxRate,
    });

    return sendSuccess(res, 201, 'Order created successfully', order);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Orders retrieved successfully', await orderService.getOrdersForUser(req.user.id));
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderForUser(req.user.id, req.params.id);
    if (!order) return sendError(res, 404, 'Order not found');
    return sendSuccess(res, 200, 'Order retrieved successfully', order);
  } catch (error) {
    return next(error);
  }
};

const getAddresses = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Addresses retrieved successfully', await addressService.listForUser(req.user.id));
  } catch (error) {
    return next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    return sendSuccess(res, 201, 'Address saved successfully', await addressService.createForUser(req.user.id, req.body));
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await addressService.updateForUser(req.user.id, req.params.id, req.body);
    if (!address) return sendError(res, 404, 'Address not found');
    return sendSuccess(res, 200, 'Address updated successfully', address);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    if (!await addressService.deleteForUser(req.user.id, req.params.id)) return sendError(res, 404, 'Address not found');
    return sendSuccess(res, 200, 'Address deleted successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};

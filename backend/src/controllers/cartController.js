const cartService = require('../services/cartService');
const { sendSuccess, sendError } = require('../utils/response');

const getCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionToken = req.headers['x-session-token'] || req.query.sessionToken || null;

    const cart = await cartService.getOrCreateCart({ userId, sessionToken });
    const items = await cartService.getCartItems(cart.id);

    return sendSuccess(res, 200, 'Cart retrieved successfully', { cart, items });
  } catch (error) {
    return next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionToken = req.headers['x-session-token'] || req.query.sessionToken || null;
    const { productId, quantity } = req.body;

    const result = await cartService.addItemToCart({ userId, sessionToken, productId, quantity });
    return sendSuccess(res, 201, 'Item added to cart', result);
  } catch (error) {
    return next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;
    const cart = await cartService.getOrCreateCart({ userId: req.user ? req.user.id : null, sessionToken: req.headers['x-session-token'] || null });
    const updated = await cartService.updateCartItemQuantity({ cartId: cart.id, itemId, quantity });

    if (!updated) {
      return sendError(res, 404, 'Cart item not found');
    }

    return sendSuccess(res, 200, 'Cart item updated successfully', { cartId: cart.id, itemId, quantity });
  } catch (error) {
    return next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.getOrCreateCart({ userId: req.user ? req.user.id : null, sessionToken: req.headers['x-session-token'] || null });
    const removed = await cartService.removeCartItem({ cartId: cart.id, itemId: req.params.id });

    if (!removed) {
      return sendError(res, 404, 'Cart item not found');
    }

    return sendSuccess(res, 200, 'Cart item removed successfully');
  } catch (error) {
    return next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.getOrCreateCart({ userId: req.user ? req.user.id : null, sessionToken: req.headers['x-session-token'] || null });
    await cartService.clearCart(cart.id);
    return sendSuccess(res, 200, 'Cart cleared successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};

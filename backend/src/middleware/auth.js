const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { sendError } = require('../utils/response');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const [rows] = await pool.query(
      `SELECT id, email, role, status, permissions FROM ${env.dbPrefix}users WHERE id = ? LIMIT 1`,
      [decoded.id]
    );
    const user = rows[0];
    if (!user || user.status !== 'active') return sendError(res, 401, 'User account is unavailable');
    let permissions = user.permissions || {};
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch { permissions = {}; }
    }
    req.user = { id: user.id, email: user.email, role: user.role, permissions };
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired token');
    }
    return next(error);
  }
};

const authorizePermission = (permission) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  if (req.user.role === 'super_admin') return next();
  if (req.user.role !== 'admin' || req.user.permissions?.[permission] !== true) {
    return sendError(res, 403, 'You do not have permission to perform this action');
  }
  return next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    const roleAllowed = roles.includes(req.user.role)
      || (req.user.role === 'super_admin' && roles.includes('admin'));
    if (!roleAllowed) {
      return sendError(res, 403, 'Access denied');
    }

    return next();
  };
};

const enforceAdminPermission = (req, res, next) => {
  if (req.user?.role === 'super_admin') return next();
  const path = req.path;
  const method = req.method;
  let permission = 'dashboard.view';

  if (path.startsWith('/products')) permission = `products.${method === 'GET' ? 'view' : method === 'DELETE' ? 'delete' : method === 'POST' ? 'create' : 'edit'}`;
  else if (path.startsWith('/categories')) permission = `categories.${method === 'GET' ? 'view' : method === 'DELETE' ? 'delete' : method === 'POST' ? 'create' : 'edit'}`;
  else if (path.startsWith('/orders')) permission = `orders.${method === 'GET' ? 'view' : 'edit'}`;
  else if (path.startsWith('/customers')) permission = `customers.${method === 'GET' ? 'view' : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'edit'}`;
  else if (path.startsWith('/users')) permission = `users.${method === 'GET' ? 'view' : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'edit'}`;
  else if (path.startsWith('/settings')) permission = `settings.${method === 'GET' ? 'view' : 'edit'}`;
  else if (path.startsWith('/smtp')) permission = `settings.${method === 'GET' ? 'view' : 'edit'}`;
  else if (path.startsWith('/payment-gateways')) permission = `payment_gateways.${method === 'GET' ? 'view' : 'edit'}`;
  else if (path.startsWith('/content')) permission = `content.${method === 'GET' ? 'view' : method === 'DELETE' ? 'delete' : method === 'POST' ? 'create' : 'edit'}`;

  return authorizePermission(permission)(req, res, next);
};

module.exports = {
  authenticate,
  authorize,
  authorizePermission,
  enforceAdminPermission,
};

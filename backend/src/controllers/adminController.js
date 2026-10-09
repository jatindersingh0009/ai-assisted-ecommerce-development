const { sendSuccess, sendError } = require('../utils/response');
const adminService = require('../services/adminService');
const paymentGatewayService = require('../services/paymentGatewayService');
const { categoryValidation, checkCategoryValidationErrors } = require('../validators/categoryValidator');
const permissionKeys = adminService.permissionKeys;
const smtpService = require('../services/smtpService');

const getDashboard = async (req, res, next) => {
  try {
    const summary = await adminService.getDashboardSummary();
    return sendSuccess(res, 200, 'Admin dashboard summary retrieved', summary);
  } catch (error) {
    return next(error);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Customers retrieved successfully', await adminService.getCustomers());
  } catch (error) {
    return next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await adminService.getCustomerById(req.params.id);
    if (!customer) return sendError(res, 404, 'Customer not found');
    return sendSuccess(res, 200, 'Customer retrieved successfully', customer);
  } catch (error) {
    return next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  const allowedStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!allowedStatuses.includes(req.body.orderStatus)) return sendError(res, 422, 'Invalid order status');
  try {
    const updated = await adminService.updateOrderStatus(req.params.id, req.body.orderStatus);
    if (!updated) return sendError(res, 404, 'Order not found');
    return sendSuccess(res, 200, 'Order status updated successfully');
  } catch (error) {
    return next(error);
  }
};

const getStoreSettings = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Store settings retrieved successfully', await adminService.getStoreSettings());
  } catch (error) {
    return next(error);
  }
};

const updateStoreSettings = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Store settings updated successfully', await adminService.updateStoreSettings(req.body));
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Categories retrieved successfully', await adminService.getAdminCategories());
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    return sendSuccess(res, 201, 'Category created successfully', await adminService.createAdminCategory(req.body));
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await adminService.updateAdminCategory(req.params.id, req.body);
    if (!category) return sendError(res, 404, 'Category not found');
    return sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    return next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const deleted = await adminService.deleteAdminCategory(req.params.id);
    if (!deleted) return sendError(res, 404, 'Category not found');
    return sendSuccess(res, 200, 'Category deleted successfully');
  } catch (error) {
    return next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await adminService.getAdminOrders(req.query.limit);
    return sendSuccess(res, 200, 'Orders retrieved successfully', orders);
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await adminService.getAdminOrderById(req.params.id);
    if (!order) return sendError(res, 404, 'Order not found');
    return sendSuccess(res, 200, 'Order retrieved successfully', order);
  } catch (error) {
    return next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Products retrieved successfully', await adminService.getAdminProducts());
  } catch (error) {
    return next(error);
  }
};

const getPaymentGateways = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Payment gateways retrieved successfully', await paymentGatewayService.getGatewaySettings());
  } catch (error) {
    return next(error);
  }
};

const updatePaymentGateways = async (req, res, next) => {
  try {
    const settings = await paymentGatewayService.updateGatewaySettings(req.body);
    return sendSuccess(res, 200, 'Payment gateway settings updated successfully', settings);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const getCheckoutPaymentGateways = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Available payment gateways retrieved successfully', await paymentGatewayService.getGatewaySettings());
  } catch (error) {
    return next(error);
  }
};

const getPaymentCredentialStatus = async (req, res, next) => {
  try {
    const [gateways, credentials] = await Promise.all([
      paymentGatewayService.getGatewaySettings(),
      paymentGatewayService.getCredentialStatus(),
    ]);
    return sendSuccess(res, 200, 'Payment credential status retrieved successfully', { gateways, credentials });
  } catch (error) {
    return next(error);
  }
};

const updatePaymentCredentials = async (req, res, next) => {
  try {
    const credentials = await paymentGatewayService.updateProviderCredentials(req.body);
    return sendSuccess(res, 200, 'Payment credentials saved securely', credentials);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const testPaymentCredentials = async (req, res, next) => {
  try {
    const result = await paymentGatewayService.testProviderCredentials(req.params.provider);
    return sendSuccess(res, 200, 'Payment provider test completed', result);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try { return sendSuccess(res, 200, 'Users retrieved successfully', await adminService.getManagedUsers(req.user.role)); }
  catch (error) { return next(error); }
};

const createUser = async (req, res, next) => {
  const { firstName, lastName, email, password, role = 'customer', permissions = {} } = req.body;
  if (!firstName || !lastName || !email || !password || !['super_admin', 'admin', 'customer'].includes(role)) {
    return sendError(res, 422, 'First name, last name, email, password, and a valid role are required');
  }
  if (password.length < 8) return sendError(res, 422, 'Password must be at least 8 characters long');
  if (role !== 'customer' && req.user.role !== 'super_admin') return sendError(res, 403, 'Only a super admin can create admins');
  if (role !== 'admin' && Object.keys(permissions).length) return sendError(res, 422, 'Permissions can only be assigned to admin users');
  if (Object.keys(permissions).some((key) => !permissionKeys.includes(key) || typeof permissions[key] !== 'boolean')) {
    return sendError(res, 422, 'One or more permissions are invalid');
  }
  try {
    const user = await adminService.createManagedUser({ firstName, lastName, email, password, role, permissions });
    return sendSuccess(res, 201, 'User created successfully', user);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'A user with this email already exists');
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  const { firstName, lastName, email, role, status, permissions = {} } = req.body;
  if (!firstName || !lastName || !email || !['super_admin', 'admin', 'customer'].includes(role) || !['active', 'disabled', 'pending'].includes(status)) {
    return sendError(res, 422, 'Valid profile, role, and account status are required');
  }
  if (req.params.id === String(req.user.id) && (status !== 'active' || role !== req.user.role)) return sendError(res, 422, 'You cannot disable or change your own role');
  if (req.user.role === 'admin' && role !== 'customer') return sendError(res, 403, 'Only a super admin can edit administrator accounts');
  if (role !== 'customer' && req.user.role !== 'super_admin') return sendError(res, 403, 'Only a super admin can assign admin roles');
  if (Object.keys(permissions).some((key) => !permissionKeys.includes(key) || typeof permissions[key] !== 'boolean')) {
    return sendError(res, 422, 'One or more permissions are invalid');
  }
  if (req.user.role === 'admin' && Object.entries(permissions).some(([key, enabled]) => enabled && req.user.permissions?.[key] !== true)) {
    return sendError(res, 403, 'You cannot grant permissions you do not have');
  }
  try {
    if (req.user.role === 'admin' && !await adminService.getCustomerById(req.params.id)) {
      return sendError(res, 404, 'Customer not found');
    }
    const updated = await adminService.updateManagedUser(req.params.id, { firstName, lastName, email, role, status, permissions });
    if (!updated) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User updated successfully');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'A user with this email already exists');
    return next(error);
  }
};

const disableCustomer = async (req, res, next) => {
  try {
    const updated = await adminService.updateCustomerStatus(req.params.id, req.body.status);
    if (!updated) return sendError(res, 404, 'Customer not found');
    return sendSuccess(res, 200, 'Customer status updated successfully');
  } catch (error) { return next(error); }
};

const deleteUser = async (req, res, next) => {
  if (String(req.params.id) === String(req.user.id)) return sendError(res, 422, 'You cannot delete your own account');
  try {
    const deleted = await adminService.deleteManagedUser(req.params.id, req.user.role === 'super_admin');
    if (!deleted) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return sendError(res, 409, 'Customers with order history cannot be deleted; disable the account instead');
    return next(error);
  }
};

const getSmtpSettings = async (req, res, next) => {
  try { return sendSuccess(res, 200, 'SMTP settings retrieved successfully', await smtpService.getStatus()); }
  catch (error) { return next(error); }
};

const saveSmtpSettings = async (req, res, next) => {
  try { return sendSuccess(res, 200, 'SMTP settings saved securely', await smtpService.saveConfig(req.body)); }
  catch (error) { if (error.statusCode) return sendError(res, error.statusCode, error.message); return next(error); }
};

const testSmtpSettings = async (req, res, next) => {
  try { return sendSuccess(res, 200, 'SMTP test completed', await smtpService.testConnection()); }
  catch (error) { return next(error); }
};

module.exports = {
  getDashboard,
  getCustomers,
  getCustomerById,
  getOrders,
  getOrderById,
  getProducts,
  getPaymentGateways,
  updatePaymentGateways,
  getCheckoutPaymentGateways,
  updateOrderStatus,
  getStoreSettings,
  updateStoreSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPaymentCredentialStatus,
  updatePaymentCredentials,
  testPaymentCredentials,
  getUsers,
  createUser,
  updateUser,
  disableCustomer,
  deleteUser,
  getSmtpSettings,
  saveSmtpSettings,
  testSmtpSettings,
};

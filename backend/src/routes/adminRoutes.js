const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize, enforceAdminPermission } = require('../middleware/auth');
const { categoryValidation, checkCategoryValidationErrors } = require('../validators/categoryValidator');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));
router.use(enforceAdminPermission);

router.get('/dashboard', adminController.getDashboard);
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.patch('/customers/:id/status', adminController.disableCustomer);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.get('/products', adminController.getProducts);
router.get('/categories', adminController.getCategories);
router.post('/categories', categoryValidation, checkCategoryValidationErrors, adminController.createCategory);
router.put('/categories/:id', categoryValidation, checkCategoryValidationErrors, adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.get('/settings', adminController.getStoreSettings);
router.put('/settings', adminController.updateStoreSettings);
router.get('/smtp', adminController.getSmtpSettings);
router.put('/smtp', adminController.saveSmtpSettings);
router.post('/smtp/test', adminController.testSmtpSettings);
router.get('/payment-gateways', adminController.getPaymentGateways);
router.put('/payment-gateways', adminController.updatePaymentGateways);
router.get('/payment-gateways/credentials', adminController.getPaymentCredentialStatus);
router.put('/payment-gateways/credentials', adminController.updatePaymentCredentials);
router.post('/payment-gateways/test/:provider', adminController.testPaymentCredentials);

module.exports = router;

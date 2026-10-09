const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/validate', authenticate, checkoutController.validateCart);
router.post('/totals', authenticate, checkoutController.calculateTotals);
router.get('/payment-methods', checkoutController.getPaymentMethods);

module.exports = router;

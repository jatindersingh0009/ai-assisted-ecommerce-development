const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/stripe/create-intent', authenticate, paymentController.createStripeIntent);
router.post('/stripe/confirm', authenticate, paymentController.confirmStripePayment);
router.post('/stripe/webhook', paymentController.handleStripeWebhook);
router.post('/paypal/create-order', authenticate, paymentController.createPayPalOrder);
router.post('/paypal/capture', authenticate, paymentController.capturePayPalOrder);
router.post('/validate-amount', authenticate, paymentController.validatePaymentAmount);

module.exports = router;

const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, orderController.getOrders);
router.get('/addresses', authenticate, orderController.getAddresses);
router.post('/addresses', authenticate, orderController.createAddress);
router.put('/addresses/:id', authenticate, orderController.updateAddress);
router.delete('/addresses/:id', authenticate, orderController.deleteAddress);
router.get('/:id', authenticate, orderController.getOrderById);
router.post('/', authenticate, orderController.createOrder);

module.exports = router;

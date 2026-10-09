const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, cartController.getCart);
router.post('/items', authenticate, cartController.addItem);
router.put('/items', authenticate, cartController.updateItem);
router.delete('/items/:id', authenticate, cartController.removeItem);
router.delete('/clear', authenticate, cartController.clearCart);

module.exports = router;

const express = require('express');
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { productValidation, checkProductValidationErrors } = require('../validators/productValidator');

const router = express.Router();

router.get('/search', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/', productController.getProducts);
router.post('/', authenticate, authorize('admin'), productValidation, checkProductValidationErrors, productController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productValidation, checkProductValidationErrors, productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

module.exports = router;

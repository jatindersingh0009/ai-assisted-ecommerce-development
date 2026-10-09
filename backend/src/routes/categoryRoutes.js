const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { categoryValidation, checkCategoryValidationErrors } = require('../validators/categoryValidator');

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);
router.post('/', authenticate, authorize('admin'), categoryValidation, checkCategoryValidationErrors, categoryController.createCategory);
router.put('/:id', authenticate, authorize('admin'), categoryValidation, checkCategoryValidationErrors, categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), categoryController.deleteCategory);

module.exports = router;

const { body, validationResult } = require('express-validator');

const productValidation = [
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a valid positive number'),
  body('stockQty').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('status').optional().isIn(['active', 'draft', 'disabled']).withMessage('Invalid product status'),
];

const checkProductValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.mapped(),
    });
  }

  return next();
};

module.exports = {
  productValidation,
  checkProductValidationErrors,
};

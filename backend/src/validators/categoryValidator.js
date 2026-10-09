const { body, validationResult } = require('express-validator');

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('slug').optional().trim(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid category status'),
];

const checkCategoryValidationErrors = (req, res, next) => {
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
  categoryValidation,
  checkCategoryValidationErrors,
};

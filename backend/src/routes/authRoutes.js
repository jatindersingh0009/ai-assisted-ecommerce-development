const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation, checkValidationErrors } = require('../validators/authValidator');
const { body } = require('express-validator');

const router = express.Router();

router.post('/register', registerValidation, checkValidationErrors, authController.register);
router.post('/login', loginValidation, checkValidationErrors, authController.login);
router.post('/forgot-password', body('email').isEmail(), checkValidationErrors, authController.forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 8 })], checkValidationErrors, authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, [
	body('firstName').trim().notEmpty(),
	body('lastName').trim().notEmpty(),
	body('email').isEmail(),
], checkValidationErrors, authController.updateCurrentUser);
router.put('/password', authenticate, [
	body('currentPassword').notEmpty(),
	body('newPassword').isLength({ min: 8 }),
], checkValidationErrors, authController.updatePassword);

module.exports = router;

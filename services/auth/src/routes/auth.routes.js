const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updatePassword
} = require('../controllers/auth.controller');
const {
  forgotPassword,
  resetPassword,
  verifyResetToken,
  getUserResetTokens,
  cleanupExpiredTokens
} = require('../controllers/password.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('token').notEmpty().withMessage('Token is required')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Password reset routes (Public)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

// Admin routes for reset token management
router.get('/reset-tokens/:userId', protect, authorize('admin'), getUserResetTokens);
router.delete('/reset-tokens/cleanup', protect, authorize('admin'), cleanupExpiredTokens);

module.exports = router;

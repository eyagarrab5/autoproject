const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth.middleware');

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Payment API is working' });
});

// Public statistics routes (optional auth for tracking)
router.get('/stats/total', optionalAuth, paymentController.getTotalPaymentsAmount);
router.get('/stats/count', optionalAuth, paymentController.getTotalPaymentsCount);
router.get('/stats/average', optionalAuth, paymentController.getAveragePaymentAmount);
router.get('/stats/methods', optionalAuth, paymentController.getPaymentMethodsStats);
router.get('/stats/status-breakdown', optionalAuth, paymentController.getPaymentStatusStats);
router.get('/stats/monthly', optionalAuth, paymentController.getMonthlyPaymentStats);
router.get('/stats/yearly', optionalAuth, paymentController.getYearlyPaymentStats);

// Protected routes - require authentication
// Get current user's payments
router.get('/me', protect, paymentController.getMyPayments);

// Create a new payment
router.post('/', protect, paymentController.createPayment);

// Get all payments (admin)
router.get('/', protect, paymentController.getAllPayments);

// Get payment by ID
router.get('/id/:id', protect, paymentController.getPaymentById);

// Get payments by user ID
router.get('/user/:userId', protect, paymentController.getPaymentsByUserId);

// Get payments by order ID
router.get('/order/:orderId', protect, paymentController.getPaymentsByOrderId);

// Get payments by payment method
router.get('/method/:method', protect, paymentController.getPaymentsByMethod);

// Get payments by payment status
router.get('/status/:status', protect, paymentController.getPaymentsByStatus);

// Get recent payments
router.get('/recent/list', protect, paymentController.getRecentPayments);

// Get payments in date range
router.get('/daterange/list', protect, paymentController.getPaymentsInDateRange);

// Update payment status
router.put('/:id', protect, paymentController.updatePaymentStatus);

// Delete payment
router.delete('/:id', protect, paymentController.deletePayment);

// User payment history
router.get('/history/user/:userId', protect, paymentController.getUserPaymentHistory);

// Order payment history
router.get('/history/order/:orderId', protect, paymentController.getOrderPaymentHistory);

// User payment count
router.get('/count/user/:userId', protect, paymentController.getTotalPaymentsByUser);

module.exports = router;

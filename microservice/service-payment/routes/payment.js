const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Payment API is working" });
});

// Display payment page (UI)
router.get("/page", (req, res) => {
  res.render("payment");
});

// Create a new payment
router.post("/", paymentController.createPayment);

// Get all payments
router.get("/", paymentController.getAllPayments);

// Get payment by ID
router.get("/id/:id", paymentController.getPaymentById);

// Get payments by user ID
router.get("/user/:userId", paymentController.getPaymentsByUserId);

// Get payments by order ID
router.get("/order/:orderId", paymentController.getPaymentsByOrderId);

// Get payments by payment method
router.get("/method/:method", paymentController.getPaymentsByMethod);

// Get payments by payment status
router.get("/status/:status", paymentController.getPaymentsByStatus);

// Get recent payments
router.get("/recent/list", paymentController.getRecentPayments);

// Get payments in date range
router.get("/daterange/list", paymentController.getPaymentsInDateRange);

// Update payment status
router.put("/:id", paymentController.updatePaymentStatus);

// Delete payment
router.delete("/:id", paymentController.deletePayment);

// Statistics endpoints
router.get("/stats/total", paymentController.getTotalPaymentsAmount);
router.get("/stats/count", paymentController.getTotalPaymentsCount);
router.get("/stats/average", paymentController.getAveragePaymentAmount);
router.get("/stats/methods", paymentController.getPaymentMethodsStats);
router.get("/stats/status-breakdown", paymentController.getPaymentStatusStats);
router.get("/stats/monthly", paymentController.getMonthlyPaymentStats);
router.get("/stats/yearly", paymentController.getYearlyPaymentStats);

// User payment history
router.get("/history/user/:userId", paymentController.getUserPaymentHistory);

// Order payment history
router.get("/history/order/:orderId", paymentController.getOrderPaymentHistory);

// User payment count
router.get("/count/user/:userId", paymentController.getTotalPaymentsByUser);

module.exports = router;

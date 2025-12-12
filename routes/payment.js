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
// If caller requests /id without an id, return a clear 400 JSON instead of HTML 404
router.get("/id", (req, res) => {
  return res.status(400).json({ message: "Missing payment id. Use /api/payments/id/:id" });
});

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

// Support GET /api/payments/:id with explicit runtime validation of ObjectId format
// This avoids using inline regex in the route path (some path-to-regexp versions throw errors).
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (!isObjectId) {
    return res.status(400).json({ message: 'Invalid payment id format. Use a 24-character hex id.' });
  }
  // delegate to controller
  return paymentController.getPaymentById(req, res, next);
});

// Update payment status
// If caller attempts to update without providing an id, return clear 400 JSON
router.put("/", (req, res) => {
  return res.status(400).json({ message: "Missing payment id. Use /api/payments/:id to update" });
});

// Update payment status
router.put("/:id", paymentController.updatePaymentStatus);

// Delete payment
// If caller attempts to delete without providing an id, return clear 400 JSON
router.delete("/", (req, res) => {
  return res.status(400).json({ message: "Missing payment id. Use /api/payments/:id to delete" });
});

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

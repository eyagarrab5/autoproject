const express = require("express");
const router = express.Router();
const paymentTransactionController = require("../controller/paymentTransactionController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Payment Transaction API is working" });
});

// Create a new payment transaction
router.post("/", paymentTransactionController.createPaymentTransaction);

// Get all payment transactions
router.get("/", paymentTransactionController.getAllPaymentTransactions);

// Get payment transaction by ID
router.get("/id/:id", paymentTransactionController.getPaymentTransactionById);

// Get transactions by payment ID
router.get("/payment/:paymentId", paymentTransactionController.getTransactionsByPaymentId);

// Get transactions by gateway
router.get("/gateway/:gateway", paymentTransactionController.getTransactionsByGateway);

// Get transactions by event type
router.get("/event/:eventType", paymentTransactionController.getTransactionsByEventType);

// Get transactions by status
router.get("/status/:status", paymentTransactionController.getTransactionsByStatus);

// Get recent transactions
router.get("/recent/list", paymentTransactionController.getRecentTransactions);

// Get transactions in date range
router.get("/daterange/list", paymentTransactionController.getTransactionsInDateRange);

// Get failed transactions
router.get("/failed/list", paymentTransactionController.getFailedTransactions);

// Get successful transactions
router.get("/successful/list", paymentTransactionController.getSuccessfulTransactions);

// Update payment transaction
router.put("/:id", paymentTransactionController.updatePaymentTransaction);

// Delete payment transaction
router.delete("/:id", paymentTransactionController.deletePaymentTransaction);

// Statistics endpoints
router.get("/stats/gateway", paymentTransactionController.getTransactionStatsByGateway);
router.get("/stats/event-type", paymentTransactionController.getTransactionStatsByEventType);
router.get("/stats/status", paymentTransactionController.getTransactionStatsByStatus);

// Get payment with all its transactions
router.get("/complete/:paymentId", paymentTransactionController.getPaymentWithTransactions);

module.exports = router;

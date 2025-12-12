const express = require("express");
const router = express.Router();
const paymentTransactionController = require("../controller/paymentTransactionController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Payment Transaction API is working" });
});

// Create a new payment transaction
router.post("/", paymentTransactionController.createPaymentTransaction);

// Specific routes first (before the generic /:id route)
router.get("/payment/:paymentId", paymentTransactionController.getTransactionsByPaymentId);
router.get("/gateway/:gateway", paymentTransactionController.getTransactionsByGateway);
router.get("/event/:eventType", paymentTransactionController.getTransactionsByEventType);
router.get("/status/:status", paymentTransactionController.getTransactionsByStatus);
router.get("/recent/list", paymentTransactionController.getRecentTransactions);
router.get("/daterange/list", paymentTransactionController.getTransactionsInDateRange);
router.get("/failed/list", paymentTransactionController.getFailedTransactions);
router.get("/successful/list", paymentTransactionController.getSuccessfulTransactions);
router.get("/stats/gateway", paymentTransactionController.getTransactionStatsByGateway);

// Generic routes
// Get all payment transactions (must come after specific routes)
router.get("/", paymentTransactionController.getAllPaymentTransactions);

// Get payment transaction by ID - both /id/:id and /:id patterns
router.get("/id/:id", paymentTransactionController.getPaymentTransactionById);
router.get("/:id", paymentTransactionController.getPaymentTransactionById);

// Update payment transaction
router.put("/:id", paymentTransactionController.updatePaymentTransaction);

// Delete payment transaction
router.delete("/:id", paymentTransactionController.deletePaymentTransaction);
router.get("/stats/event-type", paymentTransactionController.getTransactionStatsByEventType);
router.get("/stats/status", paymentTransactionController.getTransactionStatsByStatus);

// Get payment with all its transactions
router.get("/complete/:paymentId", paymentTransactionController.getPaymentWithTransactions);

module.exports = router;

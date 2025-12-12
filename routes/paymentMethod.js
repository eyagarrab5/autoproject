const express = require("express");
const router = express.Router();
const paymentMethodController = require("../controller/paymentMethodController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Payment Method API is working" });
});

// Create a new payment method
router.post("/", paymentMethodController.createPaymentMethod);

// Get all payment methods for a user
router.get("/user/:userId", paymentMethodController.getPaymentMethodsByUserId);

// Get default payment method for a user
router.get("/user/:userId/default", paymentMethodController.getDefaultPaymentMethod);

// Get payment methods by gateway
router.get("/user/:userId/gateway/:gateway", paymentMethodController.getPaymentMethodsByGateway);

// Get payment method statistics
router.get("/stats/all", paymentMethodController.getPaymentMethodStats);

// Get expired payment methods
router.get("/expired/list", paymentMethodController.getExpiredPaymentMethods);

// Get payment method by ID - both /id/:id and /:id patterns for flexibility
router.get("/id/:id", paymentMethodController.getPaymentMethodById);
router.get("/:id", paymentMethodController.getPaymentMethodById);

// Update payment method
router.put("/:id", paymentMethodController.updatePaymentMethod);

// Set as default payment method
// If caller attempts to set default without an id (e.g. /payment-methods//set-default),
// return a clear 400 JSON instead of Express HTML 404.
router.put("/set-default", (req, res) => {
  return res.status(400).json({ message: "Missing payment method id. Use /api/payment-methods/:id/set-default" });
});

router.put("/:id/set-default", paymentMethodController.setAsDefault);

// Record last used time
// Missing-id handler for record-use
router.put("/record-use", (req, res) => {
  return res.status(400).json({ message: "Missing payment method id. Use /api/payment-methods/:id/record-use" });
});
router.put("/:id/record-use", paymentMethodController.recordLastUsed);

// Disable payment method
// Missing-id handler for disable
router.put("/disable", (req, res) => {
  return res.status(400).json({ message: "Missing payment method id. Use /api/payment-methods/:id/disable" });
});
router.put("/:id/disable", paymentMethodController.disablePaymentMethod);

// Delete payment method
// Missing-id handler for delete
router.delete("/", (req, res) => {
  return res.status(400).json({ message: "Missing payment method id. Use /api/payment-methods/:id to delete" });
});
router.delete("/:id", paymentMethodController.deletePaymentMethod);

// Get payment method statistics
router.get("/stats/all", paymentMethodController.getPaymentMethodStats);

// Get expired payment methods
router.get("/expired/list", paymentMethodController.getExpiredPaymentMethods);

module.exports = router;

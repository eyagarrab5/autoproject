const express = require("express");
const router = express.Router();
const refundController = require("../controller/refundController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Refund API is working" });
});

// Create a new refund
router.post("/", refundController.createRefund);

// Get all refunds
router.get("/", refundController.getAllRefunds);

// Get refund by ID
router.get("/id/:id", refundController.getRefundById);

// Get refunds by payment ID
router.get("/payment/:paymentId", refundController.getRefundsByPaymentId);

// Get refunds by status
router.get("/status/:status", refundController.getRefundsByStatus);

// Get refunds by reason
router.get("/reason/:reason", refundController.getRefundsByReason);

// Get refunds in date range
router.get("/daterange/list", refundController.getRefundsInDateRange);

// Get pending refunds
router.get("/pending/list", refundController.getPendingRefunds);

// Update refund
router.put("/:id", refundController.updateRefund);

// Approve refund
router.put("/:id/approve", refundController.approveRefund);

// Reject refund
router.put("/:id/reject", refundController.rejectRefund);

// Delete refund
router.delete("/:id", refundController.deleteRefund);

// Get refund statistics
router.get("/stats/all", refundController.getRefundStats);

module.exports = router;

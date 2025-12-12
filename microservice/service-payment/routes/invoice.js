const express = require("express");
const router = express.Router();
const invoiceController = require("../controller/invoiceController");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Invoice API is working" });
});

// Create a new invoice
router.post("/", invoiceController.createInvoice);

// Get all invoices
router.get("/", invoiceController.getAllInvoices);

// Get invoice by ID
router.get("/id/:id", invoiceController.getInvoiceById);

// Get invoice by number
router.get("/number/:number", invoiceController.getInvoiceByNumber);

// Get invoices by user ID
router.get("/user/:userId", invoiceController.getInvoicesByUserId);

// Get invoices by order ID
router.get("/order/:orderId", invoiceController.getInvoicesByOrderId);

// Get invoices by status
router.get("/status/:status", invoiceController.getInvoicesByStatus);

// Get invoices in date range
router.get("/daterange/list", invoiceController.getInvoicesInDateRange);

// Get overdue invoices
router.get("/overdue/list", invoiceController.getOverdueInvoices);

// Update invoice
router.put("/:id", invoiceController.updateInvoice);

// Mark as sent
router.put("/:id/mark-sent", invoiceController.markAsSent);

// Mark as paid
router.put("/:id/mark-paid", invoiceController.markAsPaid);

// Mark as partially paid
router.put("/:id/mark-partial", invoiceController.markAsPartiallyPaid);

// Mark as overdue
router.put("/:id/mark-overdue", invoiceController.markAsOverdue);

// Cancel invoice
// Missing-id handler for cancel
router.put("/cancel", (req, res) => {
  return res.status(400).json({ message: "Missing invoice id. Use /api/invoices/:id/cancel" });
});
router.put("/:id/cancel", invoiceController.cancelInvoice);

// Delete invoice
// Missing-id handler for delete
router.delete("/", (req, res) => {
  return res.status(400).json({ message: "Missing invoice id. Use /api/invoices/:id to delete" });
});
router.delete("/:id", invoiceController.deleteInvoice);

// Get invoice statistics
router.get("/stats/all", invoiceController.getInvoiceStats);

// Get total invoice amount by user
router.get("/total/user/:userId", invoiceController.getTotalInvoiceAmountByUser);

module.exports = router;

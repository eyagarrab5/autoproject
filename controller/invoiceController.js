const invoice = require("../model/invoice");
const payment = require("../model/payment");

// Créer une nouvelle facture
exports.createInvoice = async (req, res) => {
  try {
    const { paymentId, orderId, userId, items, subtotal, taxRate, discountAmount, discountCode, total, currency, dueDate, paymentMethod, notes, terms, billingAddress, shippingAddress, companyInfo } = req.body;

    // Vérifier que le paiement existe
    const paymentRecord = await payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Générer un numéro de facture unique
    const invoiceCount = await invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Calculer la taxe
    const taxAmount = subtotal * (taxRate || 0) / 100;

    const newInvoice = new invoice({
      paymentId,
      orderId,
      userId,
      invoiceNumber,
      items,
      subtotal,
      taxAmount,
      taxRate: taxRate || 0,
      discountAmount: discountAmount || 0,
      discountCode,
      total: total || (subtotal + taxAmount - (discountAmount || 0)),
      currency: currency || 'EUR',
      dueDate,
      paymentMethod,
      notes,
      terms,
      billingAddress,
      shippingAddress,
      companyInfo
    });

    const savedInvoice = await newInvoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer toutes les factures
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await invoice.find().populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer une facture par ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoiceRecord = await invoice.findById(invoiceId).populate('paymentId');
    if (!invoiceRecord) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(invoiceRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer une facture par numéro
exports.getInvoiceByNumber = async (req, res) => {
  try {
    const invoiceNumber = req.params.number;
    const invoiceRecord = await invoice.findOne({ invoiceNumber }).populate('paymentId');
    if (!invoiceRecord) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(invoiceRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les factures d'un utilisateur
exports.getInvoicesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const invoices = await invoice.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les factures d'une commande
exports.getInvoicesByOrderId = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const invoices = await invoice.find({ orderId }).sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les factures par statut
exports.getInvoicesByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const invoices = await invoice.find({ status }).populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une facture
exports.updateInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updates = req.body;
    updates.updatedAt = Date.now();

    const updatedInvoice = await invoice.findByIdAndUpdate(invoiceId, updates, { new: true }).populate('paymentId');
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une facture comme envoyée
exports.markAsSent = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updatedInvoice = await invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'sent', updatedAt: Date.now() },
      { new: true }
    ).populate('paymentId');
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une facture comme payée
exports.markAsPaid = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updatedInvoice = await invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'paid', paidDate: Date.now(), updatedAt: Date.now() },
      { new: true }
    ).populate('paymentId');
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une facture comme partiellement payée
exports.markAsPartiallyPaid = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updatedInvoice = await invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'partially_paid', updatedAt: Date.now() },
      { new: true }
    ).populate('paymentId');
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une facture comme échue
exports.markAsOverdue = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updatedInvoice = await invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'overdue', updatedAt: Date.now() },
      { new: true }
    ).populate('paymentId');
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Annuler une facture
exports.cancelInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updatedInvoice = await invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'canceled', updatedAt: Date.now() },
      { new: true }
    ).populate('paymentId');
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une facture
exports.deleteInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const deletedInvoice = await invoice.findByIdAndDelete(invoiceId);
    if (!deletedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les statistiques des factures
exports.getInvoiceStats = async (req, res) => {
  try {
    const stats = await invoice.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" }
        }
      }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les factures échues
exports.getOverdueInvoices = async (req, res) => {
  try {
    const today = new Date();
    const invoices = await invoice.find({
      dueDate: { $lt: today },
      status: { $ne: 'paid', $ne: 'canceled' }
    }).populate('paymentId').sort({ dueDate: 1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les factures par plage de dates
exports.getInvoicesInDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const invoices = await invoice.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir le montant total des factures par utilisateur
exports.getTotalInvoiceAmountByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await invoice.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalAmount: { $sum: "$total" } } }
    ]);
    const totalAmount = result[0] ? result[0].totalAmount : 0;
    res.status(200).json({ userId, totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

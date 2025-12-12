const refund = require("../model/refund");
const payment = require("../model/payment");

// Créer une nouvelle demande de remboursement
exports.createRefund = async (req, res) => {
  try {
    const { paymentId, amount, currency, reason, reasonDetails, gateway, initiatedBy, metadata } = req.body;

    // Vérifier que le paiement existe
    const paymentRecord = await payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Vérifier que le montant ne dépasse pas le montant du paiement
    if (amount > paymentRecord.amount) {
      return res.status(400).json({ message: "Refund amount cannot exceed payment amount" });
    }

    const newRefund = new refund({
      paymentId,
      amount,
      currency: currency || paymentRecord.currency || 'EUR',
      reason,
      reasonDetails,
      gateway,
      initiatedBy,
      metadata
    });

    const savedRefund = await newRefund.save();
    res.status(201).json(savedRefund);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer tous les remboursements
exports.getAllRefunds = async (req, res) => {
  try {
    const refunds = await refund.find().populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un remboursement par ID
exports.getRefundById = async (req, res) => {
  try {
    const refundId = req.params.id;
    const refundRecord = await refund.findById(refundId).populate('paymentId');
    if (!refundRecord) {
      return res.status(404).json({ message: "Refund not found" });
    }
    res.status(200).json(refundRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les remboursements par paymentId
exports.getRefundsByPaymentId = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const refunds = await refund.find({ paymentId }).sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les remboursements par statut
exports.getRefundsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const refunds = await refund.find({ status }).populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les remboursements par raison
exports.getRefundsByReason = async (req, res) => {
  try {
    const reason = req.params.reason;
    const refunds = await refund.find({ reason }).populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un remboursement
exports.updateRefund = async (req, res) => {
  try {
    const refundId = req.params.id;
    const updates = req.body;

    // Définir processedAt si le statut change à 'processing'
    if (updates.status === 'processing' && !updates.processedAt) {
      updates.processedAt = Date.now();
    }

    // Définir completedAt si le statut est 'succeeded' ou 'failed'
    if ((updates.status === 'succeeded' || updates.status === 'failed') && !updates.completedAt) {
      updates.completedAt = Date.now();
    }

    const updatedRefund = await refund.findByIdAndUpdate(refundId, updates, { new: true }).populate('paymentId');
    if (!updatedRefund) {
      return res.status(404).json({ message: "Refund not found" });
    }
    res.status(200).json(updatedRefund);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approuver un remboursement
exports.approveRefund = async (req, res) => {
  try {
    const refundId = req.params.id;
    const refundRecord = await refund.findById(refundId);
    if (!refundRecord) {
      return res.status(404).json({ message: "Refund not found" });
    }

    const updatedRefund = await refund.findByIdAndUpdate(
      refundId,
      { status: 'processing', processedAt: Date.now() },
      { new: true }
    ).populate('paymentId');
    res.status(200).json(updatedRefund);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rejeter un remboursement
exports.rejectRefund = async (req, res) => {
  try {
    const refundId = req.params.id;
    const { errorMessage } = req.body;

    const updatedRefund = await refund.findByIdAndUpdate(
      refundId,
      { status: 'failed', errorMessage, completedAt: Date.now() },
      { new: true }
    ).populate('paymentId');
    if (!updatedRefund) {
      return res.status(404).json({ message: "Refund not found" });
    }
    res.status(200).json(updatedRefund);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un remboursement
exports.deleteRefund = async (req, res) => {
  try {
    const refundId = req.params.id;
    const deletedRefund = await refund.findByIdAndDelete(refundId);
    if (!deletedRefund) {
      return res.status(404).json({ message: "Refund not found" });
    }
    res.status(200).json({ message: "Refund deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les statistiques de remboursement
exports.getRefundStats = async (req, res) => {
  try {
    const stats = await refund.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les remboursements par plage de dates
exports.getRefundsInDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const refunds = await refund.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les remboursements en attente
exports.getPendingRefunds = async (req, res) => {
  try {
    const refunds = await refund.find({ status: 'pending' }).populate('paymentId').sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

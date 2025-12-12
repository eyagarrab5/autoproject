const paymentTransaction = require("../model/paymentTransaction");
const payment = require("../model/payment");

// Créer une nouvelle transaction de paiement
exports.createPaymentTransaction = async (req, res) => {
  try {
    const { paymentId, transactionId, gateway, eventType, amount, currency, status, metadata, errorMessage } = req.body;
    
    // Vérifier que le paiement existe
    const paymentRecord = await payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const newTransaction = new paymentTransaction({
      paymentId,
      transactionId,
      gateway,
      eventType,
      amount,
      currency,
      status,
      metadata,
      errorMessage
    });
    
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer toutes les transactions
exports.getAllPaymentTransactions = async (req, res) => {
  try {
    const transactions = await paymentTransaction.find().populate('paymentId');
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer une transaction par ID
exports.getPaymentTransactionById = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const transaction = await paymentTransaction.findById(transactionId).populate('paymentId');
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les transactions par paymentId
exports.getTransactionsByPaymentId = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const transactions = await paymentTransaction.find({ paymentId: paymentId }).sort({ processedAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les transactions par gateway
exports.getTransactionsByGateway = async (req, res) => {
  try {
    const gateway = req.params.gateway;
    const transactions = await paymentTransaction.find({ gateway: gateway });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les transactions par eventType
exports.getTransactionsByEventType = async (req, res) => {
  try {
    const eventType = req.params.eventType;
    const transactions = await paymentTransaction.find({ eventType: eventType });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les transactions par statut
exports.getTransactionsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const transactions = await paymentTransaction.find({ status: status });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une transaction
exports.updatePaymentTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const updates = req.body;
    const updatedTransaction = await paymentTransaction.findByIdAndUpdate(
      transactionId,
      updates,
      { new: true }
    ).populate('paymentId');
    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une transaction
exports.deletePaymentTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const deletedTransaction = await paymentTransaction.findByIdAndDelete(transactionId);
    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les statistiques des transactions par gateway
exports.getTransactionStatsByGateway = async (req, res) => {
  try {
    const stats = await paymentTransaction.aggregate([
      {
        $group: {
          _id: "$gateway",
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

// Obtenir les statistiques des transactions par eventType
exports.getTransactionStatsByEventType = async (req, res) => {
  try {
    const stats = await paymentTransaction.aggregate([
      {
        $group: {
          _id: "$eventType",
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

// Obtenir les statistiques des transactions par statut
exports.getTransactionStatsByStatus = async (req, res) => {
  try {
    const stats = await paymentTransaction.aggregate([
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

// Obtenir les transactions récentes
exports.getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const transactions = await paymentTransaction.find().sort({ processedAt: -1 }).limit(limit).populate('paymentId');
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les transactions par plage de dates
exports.getTransactionsInDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await paymentTransaction.find({
      processedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('paymentId');
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les transactions échouées
exports.getFailedTransactions = async (req, res) => {
  try {
    const transactions = await paymentTransaction.find({ 
      eventType: { $in: ['failed', 'refunded', 'partially_refunded', 'canceled'] }
    }).populate('paymentId');
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les transactions réussies
exports.getSuccessfulTransactions = async (req, res) => {
  try {
    const transactions = await paymentTransaction.find({ 
      eventType: { $in: ['succeeded', 'captured'] }
    }).populate('paymentId');
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un résumé complet d'un paiement avec toutes ses transactions
exports.getPaymentWithTransactions = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const paymentRecord = await payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment not found" });
    }
    const transactions = await paymentTransaction.find({ paymentId: paymentId }).sort({ processedAt: -1 });
    res.status(200).json({
      payment: paymentRecord,
      transactions: transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

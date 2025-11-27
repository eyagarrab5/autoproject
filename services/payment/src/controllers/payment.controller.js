const Payment = require('../models/payment.model');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { userId, orderId, amount, paymentMethod, paymentStatus } = req.body;
    
    // Use authenticated user's ID if available
    const paymentUserId = req.user?.id || userId;
    
    const newPayment = new Payment({
      userId: paymentUserId,
      orderId,
      amount,
      paymentMethod,
      paymentStatus: paymentStatus || 'pending'
    });
    
    const savedPayment = await newPayment.save();
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-created', savedPayment);
    }
    
    res.status(201).json({ success: true, data: savedPayment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const paymentRecord = await Payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.status(200).json({ success: true, data: paymentRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments by user ID
exports.getPaymentsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const payments = await Payment.find({ userId: userId });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json({ success: true, data: payments, count: payments.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { paymentStatus } = req.body;
    
    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      { paymentStatus },
      { new: true, runValidators: true }
    );
    
    if (!updatedPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-updated', updatedPayment);
    }
    
    res.status(200).json({ success: true, data: updatedPayment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const deletedPayment = await Payment.findByIdAndDelete(paymentId);
    
    if (!deletedPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.status(200).json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments by order ID
exports.getPaymentsByOrderId = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const payments = await Payment.find({ orderId: orderId });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get total payments amount
exports.getTotalPaymentsAmount = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    const totalAmount = result[0] ? result[0].totalAmount : 0;
    res.status(200).json({ success: true, data: { totalAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments by method
exports.getPaymentsByMethod = async (req, res) => {
  try {
    const paymentMethod = req.params.method;
    const payments = await Payment.find({ paymentMethod: paymentMethod });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments by status
exports.getPaymentsByStatus = async (req, res) => {
  try {
    const paymentStatus = req.params.status;
    const payments = await Payment.find({ paymentStatus: paymentStatus });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get recent payments
exports.getRecentPayments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments in date range
exports.getPaymentsInDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const payments = await Payment.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get total payments count
exports.getTotalPaymentsCount = async (req, res) => {
  try {
    const count = await Payment.countDocuments();
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get total payments by user
exports.getTotalPaymentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await Payment.countDocuments({ userId: userId });
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get average payment amount
exports.getAveragePaymentAmount = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $group: { _id: null, averageAmount: { $avg: '$amount' } } }
    ]);
    const averageAmount = result[0] ? result[0].averageAmount : 0;
    res.status(200).json({ success: true, data: { averageAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment methods stats
exports.getPaymentMethodsStats = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment status stats
exports.getPaymentStatusStats = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user payment history
exports.getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const payments = await Payment.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get order payment history
exports.getOrderPaymentHistory = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const payments = await Payment.find({ orderId: orderId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get monthly payment stats
exports.getMonthlyPaymentStats = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get yearly payment stats
exports.getYearlyPaymentStats = async (req, res) => {
  try {
    const result = await Payment.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1 } }
    ]);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user's payments
exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

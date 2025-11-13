const payment = require("../model/payment");

exports.createPayment = async (req, res) => {
  try {
    const { userId, orderId, amount, paymentMethod, paymentStatus } = req.body;
    const newPayment = new payment({
      userId,
      orderId,
      amount,
      paymentMethod,
      paymentStatus
    });
    const savedPayment = await newPayment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const paymentRecord = await payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(paymentRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const payments = await payment.find({ userId: userId });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    console.log("Fetching all payments...");
    const payments = await payment.find();
    console.log("Payments found:", payments.length);
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { paymentStatus } = req.body;
    const updatedPayment = await payment.findByIdAndUpdate(
        paymentId, { paymentStatus }, { new: true }
    );
    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const deletedPayment = await payment.findByIdAndDelete(paymentId);
    if (!deletedPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByOrderId = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const payments = await payment.find({ orderId: orderId });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTotalPaymentsAmount = async (req, res) => {
  try {
    const result = await payment.aggregate([
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    const totalAmount = result[0] ? result[0].totalAmount : 0;
    res.status(200).json({ totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByMethod = async (req, res) => {
  try {
    const paymentMethod = req.params.method;
    const payments = await payment.find({ paymentMethod: paymentMethod });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByStatus = async (req, res) => {
  try {
    const paymentStatus = req.params.status;
    const payments = await payment.find({ paymentStatus: paymentStatus });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentPayments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const payments = await payment.find().sort({ createdAt: -1 }).limit(limit);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsInDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const payments = await payment.find({
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getTotalPaymentsCount = async (req, res) => {
  try {
    const count = await payment.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getTotalPaymentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const count = await payment.countDocuments({ userId: userId });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAveragePaymentAmount = async (req, res) => {
  try {
    const result = await payment.aggregate([
        { $group: { _id: null, averageAmount: { $avg: "$amount" } } }
    ]);
    const averageAmount = result[0] ? result[0].averageAmount : 0;
    res.status(200).json({ averageAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentMethodsStats = async (req, res) => {
  try {
    const result = await payment.aggregate([
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } }
    ]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentStatusStats = async (req, res) => {
  try {
    const result = await payment.aggregate([
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
    ]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const payments = await payment.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderPaymentHistory = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const payments = await payment.find({ orderId: orderId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMonthlyPaymentStats = async (req, res) => {
  try {
    const result = await payment.aggregate([
        {
            $group: {
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getYearlyPaymentStats = async (req, res) => {
  try {
    const result = await payment.aggregate([
        {
            $group: {
                _id: { year: { $year: "$createdAt" } },
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1 } }
    ]);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
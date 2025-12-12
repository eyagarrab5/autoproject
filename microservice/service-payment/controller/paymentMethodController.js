const paymentMethod = require("../model/paymentMethod");

// Créer une nouvelle méthode de paiement
exports.createPaymentMethod = async (req, res) => {
  try {
    const { userId, gatewayCustomerId, gateway, type, last4, brand, expiryMonth, expiryYear, holderName, isDefault, metadata } = req.body;

    // Si isDefault est true, désactiver les autres
    if (isDefault) {
      await paymentMethod.updateMany({ userId }, { isDefault: false });
    }

    const newMethod = new paymentMethod({
      userId,
      gatewayCustomerId,
      gateway,
      type,
      last4,
      brand,
      expiryMonth,
      expiryYear,
      holderName,
      isDefault,
      metadata
    });

    const savedMethod = await newMethod.save();
    res.status(201).json(savedMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer toutes les méthodes de paiement d'un utilisateur
exports.getPaymentMethodsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const methods = await paymentMethod.find({ userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer une méthode de paiement par ID
exports.getPaymentMethodById = async (req, res) => {
  try {
    const methodId = req.params.id;
    const method = await paymentMethod.findById(methodId);
    if (!method) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer la méthode par défaut d'un utilisateur
exports.getDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.params.userId;
    const method = await paymentMethod.findOne({ userId, isDefault: true, isActive: true });
    if (!method) {
      return res.status(404).json({ message: "No default payment method found" });
    }
    res.status(200).json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les méthodes par gateway
exports.getPaymentMethodsByGateway = async (req, res) => {
  try {
    const userId = req.params.userId;
    const gateway = req.params.gateway;
    const methods = await paymentMethod.find({ userId, gateway, isActive: true });
    res.status(200).json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une méthode de paiement
exports.updatePaymentMethod = async (req, res) => {
  try {
    const methodId = req.params.id;
    const updates = req.body;

    // Si isDefault est true, désactiver les autres
    if (updates.isDefault) {
      const method = await paymentMethod.findById(methodId);
      if (method) {
        await paymentMethod.updateMany({ userId: method.userId }, { isDefault: false });
      }
    }

    updates.updatedAt = Date.now();
    const updatedMethod = await paymentMethod.findByIdAndUpdate(methodId, updates, { new: true });
    if (!updatedMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(updatedMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer comme méthode par défaut
exports.setAsDefault = async (req, res) => {
  try {
    const methodId = req.params.id;
    const method = await paymentMethod.findById(methodId);
    if (!method) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    await paymentMethod.updateMany({ userId: method.userId }, { isDefault: false });
    const updatedMethod = await paymentMethod.findByIdAndUpdate(methodId, { isDefault: true }, { new: true });
    res.status(200).json(updatedMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour lastUsedAt
exports.recordLastUsed = async (req, res) => {
  try {
    const methodId = req.params.id;
    const updatedMethod = await paymentMethod.findByIdAndUpdate(
      methodId,
      { lastUsedAt: Date.now() },
      { new: true }
    );
    if (!updatedMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(updatedMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Désactiver une méthode de paiement (soft delete)
exports.disablePaymentMethod = async (req, res) => {
  try {
    const methodId = req.params.id;
    const updatedMethod = await paymentMethod.findByIdAndUpdate(
      methodId,
      { isActive: false },
      { new: true }
    );
    if (!updatedMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json(updatedMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une méthode de paiement
exports.deletePaymentMethod = async (req, res) => {
  try {
    const methodId = req.params.id;
    const deletedMethod = await paymentMethod.findByIdAndDelete(methodId);
    if (!deletedMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(200).json({ message: "Payment method deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les statistiques des méthodes par gateway
exports.getPaymentMethodStats = async (req, res) => {
  try {
    const stats = await paymentMethod.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$gateway",
          count: { $sum: 1 },
          brands: { $push: "$brand" }
        }
      }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les méthodes expirées
exports.getExpiredPaymentMethods = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const methods = await paymentMethod.find({
      isActive: true,
      $or: [
        { expiryYear: { $lt: currentYear } },
        { expiryYear: currentYear, expiryMonth: { $lt: currentMonth } }
      ]
    });
    res.status(200).json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

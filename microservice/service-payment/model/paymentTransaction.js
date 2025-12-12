const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentTransactionSchema = new Schema({
    paymentId: {
        type: Schema.Types.ObjectId,
        ref: 'payment',  // Référence au document principal de paiement
        required: true
    },
    transactionId: {
        type: String,  // ID fourni par la gateway (ex. Stripe: "pi_xxx" ou "ch_xxx")
        required: true
    },
    gateway: {
        type: String,  // Nom de la gateway : "stripe", "paypal", "bank_transfer", etc.
        required: true
    },
    eventType: {
        type: String,
        enum: ['initiated', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'captured', 'canceled'],
        required: true
    },
    amount: {
        type: Number,  // Montant concerné par cette transaction (utile pour remboursements partiels)
        required: true
    },
    currency: {
        type: String,
        default: 'EUR'  // Ou la devise de votre projet (USD, etc.)
    },
    status: {
        type: String,
        required: true  // Statut détaillé retourné par la gateway
    },
    metadata: {
        type: Schema.Types.Mixed,  // Données supplémentaires (ex. raison d'échec, infos carte masquée)
        default: {}
    },
    errorMessage: {
        type: String  // En cas d'échec
    },
    processedAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour des recherches rapides par paymentId ou transactionId
paymentTransactionSchema.index({ paymentId: 1 });
paymentTransactionSchema.index({ transactionId: 1 });

module.exports = mongoose.model('paymentTransaction', paymentTransactionSchema);

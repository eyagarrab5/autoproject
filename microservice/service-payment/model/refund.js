const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refundSchema = new Schema({
    paymentId: {
        type: Schema.Types.ObjectId,
        ref: 'payment',
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'EUR'
    },
    reason: {
        type: String,
        enum: ['requested_by_customer', 'duplicate', 'fraudulent', 'unrecognized_transaction', 'service_issue', 'other'],
        required: true
    },
    reasonDetails: {
        type: String  // Explication détaillée de la raison du remboursement
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled'],
        default: 'pending',
    },
    gatewayRefundId: {
        type: String  // ID du remboursement fourni par la gateway (Stripe: re_xxx)
    },
    gateway: {
        type: String  // stripe, paypal, etc.
    },
    initiatedBy: {
        type: String  // userId ou 'admin'
    },
    errorMessage: {
        type: String  // En cas d'échec
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
});

// Index pour des recherches rapides
refundSchema.index({ paymentId: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ createdAt: -1 });

module.exports = mongoose.model('refund', refundSchema);

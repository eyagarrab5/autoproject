const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    paymentId: {
        type: Schema.Types.ObjectId,
        ref: 'payment',
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true  // Format: INV-2024-001234
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'canceled'],
        default: 'draft'
    },
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        amount: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    taxRate: {
        type: Number,  // Pourcentage (ex: 20 pour 20%)
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    discountCode: {
        type: String
    },
    total: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'EUR'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    paidDate: {
        type: Date
    },
    paymentMethod: {
        type: String  // Carte utilisée, PayPal, virement, etc.
    },
    notes: {
        type: String
    },
    terms: {
        type: String  // Conditions de paiement, délai, etc.
    },
    billingAddress: {
        name: String,
        street: String,
        city: String,
        zipCode: String,
        country: String,
        email: String,
        phone: String
    },
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        zipCode: String,
        country: String
    },
    companyInfo: {
        name: String,
        siret: String,
        address: String,
        email: String,
        phone: String
    },
    attachments: [{
        filename: String,
        url: String,
        type: String
    }],
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour recherches rapides
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('invoice', invoiceSchema);

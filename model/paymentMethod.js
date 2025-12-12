const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentMethodSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    gatewayCustomerId: {
        type: String,  // Ex: Stripe customer ID (cus_xxx), PayPal ID, etc.
        required: true
    },
    gateway: {
        type: String,  // stripe, paypal, bank_transfer, apple_pay, google_pay
        required: true
    },
    type: {
        type: String,  // card, bank_account, wallet, etc.
        required: true
    },
    last4: {
        type: String   // 4 derniers chiffres de la carte/compte
    },
    brand: {
        type: String,  // Visa, Mastercard, Amex, Discover, Bank Transfer, etc.
        enum: ['Visa', 'Mastercard', 'Amex', 'Discover', 'Diners', 'JCB', 'Bank Transfer', 'PayPal', 'Apple Pay', 'Google Pay', 'Other']
    },
    expiryMonth: {
        type: Number   // 1-12
    },
    expiryYear: {
        type: Number   // YYYY
    },
    holderName: {
        type: String
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Schema.Types.Mixed,  // Données supplémentaires (token sauvegardé, etc.)
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastUsedAt: {
        type: Date
    }
});

// Index pour recherches rapides
paymentMethodSchema.index({ userId: 1, isActive: 1 });
paymentMethodSchema.index({ gatewayCustomerId: 1 });
paymentMethodSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('paymentMethod', paymentMethodSchema);

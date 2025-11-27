const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 30 * 60 * 1000 // 30 minutes
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index to automatically delete expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate reset token
passwordResetTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// Hash token before saving
passwordResetTokenSchema.pre('save', async function (next) {
  if (!this.isModified('token')) {
    return next();
  }
  // Hash the token
  this.token = crypto.createHash('sha256').update(this.token).digest('hex');
  next();
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

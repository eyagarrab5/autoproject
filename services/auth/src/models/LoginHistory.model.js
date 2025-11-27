const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    device: {
      type: {
        type: String, // mobile, tablet, desktop
        default: 'unknown'
      },
      browser: {
        type: String,
        default: 'unknown'
      },
      os: {
        type: String,
        default: 'unknown'
      },
      platform: {
        type: String,
        default: 'unknown'
      }
    },
    location: {
      country: String,
      city: String,
      region: String,
      timezone: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    loginStatus: {
      type: String,
      enum: ['success', 'failed', 'blocked'],
      required: true
    },
    failureReason: {
      type: String
    },
    sessionDuration: {
      type: Number, // in minutes
      default: 0
    },
    logoutAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
loginHistorySchema.index({ user: 1, createdAt: -1 });
loginHistorySchema.index({ ipAddress: 1 });
loginHistorySchema.index({ loginStatus: 1 });
loginHistorySchema.index({ createdAt: -1 });

// TTL index to auto-delete old records after 90 days
loginHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);

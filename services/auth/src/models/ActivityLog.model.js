const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Auth actions
        'user.register',
        'user.login',
        'user.logout',
        'user.password.update',
        'user.password.reset.request',
        'user.password.reset.complete',
        
        // Profile actions
        'profile.create',
        'profile.update',
        'profile.view',
        'profile.delete',
        
        // User management (admin)
        'user.create',
        'user.update',
        'user.delete',
        'user.view',
        'user.list',
        
        // Other actions
        'account.deactivate',
        'account.activate',
        'data.export',
        'settings.update'
      ]
    },
    actionCategory: {
      type: String,
      enum: ['authentication', 'profile', 'user_management', 'account', 'data', 'settings'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Flexible object for additional data
      default: {}
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success'
    },
    errorMessage: {
      type: String
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // For admin actions on other users
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ actionCategory: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ targetUser: 1 });

// TTL index to auto-delete old logs after 180 days (6 months)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

// Virtual for formatted timestamp in GMT+1
activityLogSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString('fr-FR', { 
    timeZone: 'Europe/Paris',
    dateStyle: 'short',
    timeStyle: 'medium'
  });
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

const ActivityLog = require('../models/ActivityLog.model');

/**
 * Log user activity
 * @param {Object} data - Activity data
 * @param {string} data.userId - User ID
 * @param {string} data.action - Action type
 * @param {string} data.description - Action description
 * @param {string} data.ipAddress - IP address
 * @param {string} data.userAgent - User agent
 * @param {Object} data.metadata - Additional metadata
 * @param {string} data.status - Status (success/failed/pending)
 * @param {string} data.errorMessage - Error message if failed
 * @param {string} data.targetUser - Target user ID (for admin actions)
 * @param {Object} data.changes - Before/after changes
 */
const logActivity = async (data) => {
  try {
    const {
      userId,
      action,
      description,
      ipAddress,
      userAgent,
      metadata = {},
      status = 'success',
      errorMessage,
      targetUser,
      changes
    } = data;

    // Determine action category
    const actionCategory = getActionCategory(action);

    const activityLog = await ActivityLog.create({
      user: userId,
      action,
      actionCategory,
      description,
      metadata,
      ipAddress,
      userAgent,
      status,
      errorMessage,
      targetUser,
      changes
    });

    return activityLog;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - logging should not break the main flow
    return null;
  }
};

/**
 * Determine action category from action type
 */
const getActionCategory = (action) => {
  if (action.startsWith('user.login') || action.startsWith('user.logout') || 
      action.startsWith('user.register') || action.startsWith('user.password')) {
    return 'authentication';
  }
  if (action.startsWith('profile.')) {
    return 'profile';
  }
  if (action.startsWith('user.create') || action.startsWith('user.update') || 
      action.startsWith('user.delete') || action.startsWith('user.view') || 
      action.startsWith('user.list')) {
    return 'user_management';
  }
  if (action.startsWith('account.')) {
    return 'account';
  }
  if (action.startsWith('data.')) {
    return 'data';
  }
  if (action.startsWith('settings.')) {
    return 'settings';
  }
  return 'other';
};

module.exports = {
  logActivity
};

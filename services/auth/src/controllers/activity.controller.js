const ActivityLog = require('../models/ActivityLog.model');

// @desc    Get current user's activity logs
// @route   GET /api/activity/me
// @access  Private
exports.getMyActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };

    // Optional filters
    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.actionCategory) {
      filter.actionCategory = req.query.actionCategory;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await ActivityLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all activity logs (Admin)
// @route   GET /api/activity
// @access  Private/Admin
exports.getAllActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};

    // Optional filters
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.actionCategory) {
      filter.actionCategory = req.query.actionCategory;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email role')
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await ActivityLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity stats
// @route   GET /api/activity/stats
// @access  Private/Admin
exports.getActivityStats = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const filter = userId ? { user: userId } : {};

    // Get stats by action category
    const categoryStats = await ActivityLog.aggregate([
      { $match: filter },
      { $group: {
        _id: '$actionCategory',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 }}
    ]);

    // Get stats by status
    const statusStats = await ActivityLog.aggregate([
      { $match: filter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    // Get most common actions
    const topActions = await ActivityLog.aggregate([
      { $match: filter },
      { $group: {
        _id: '$action',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 }},
      { $limit: 10 }
    ]);

    // Get activity by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await ActivityLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: sevenDaysAgo } }},
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }},
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 }}
    ]);

    res.status(200).json({
      success: true,
      data: {
        byCategory: categoryStats,
        byStatus: statusStats,
        topActions,
        dailyActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete old activity logs
// @route   DELETE /api/activity/cleanup
// @access  Private/Admin
exports.cleanupOldLogs = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 180; // Default 180 days
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: dateThreshold }
    });

    res.status(200).json({
      success: true,
      message: `Deleted activity logs older than ${days} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

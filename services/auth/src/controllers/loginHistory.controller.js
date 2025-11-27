const LoginHistory = require('../models/LoginHistory.model');

// @desc    Get current user's login history
// @route   GET /api/login-history/me
// @access  Private
exports.getMyLoginHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };

    // Optional filters
    if (req.query.loginStatus) {
      filter.loginStatus = req.query.loginStatus;
    }

    const history = await LoginHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await LoginHistory.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all login history (Admin)
// @route   GET /api/login-history
// @access  Private/Admin
exports.getAllLoginHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};

    // Optional filters
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    if (req.query.loginStatus) {
      filter.loginStatus = req.query.loginStatus;
    }
    if (req.query.ipAddress) {
      filter.ipAddress = req.query.ipAddress;
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

    const history = await LoginHistory.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await LoginHistory.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get login statistics
// @route   GET /api/login-history/stats
// @access  Private/Admin
exports.getLoginStats = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const filter = userId ? { user: userId } : {};

    // Get stats by login status
    const statusStats = await LoginHistory.aggregate([
      { $match: filter },
      { $group: {
        _id: '$loginStatus',
        count: { $sum: 1 }
      }}
    ]);

    // Get stats by device type
    const deviceStats = await LoginHistory.aggregate([
      { $match: filter },
      { $group: {
        _id: '$device.type',
        count: { $sum: 1 }
      }}
    ]);

    // Get stats by browser
    const browserStats = await LoginHistory.aggregate([
      { $match: filter },
      { $group: {
        _id: '$device.browser',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 }}
    ]);

    // Get stats by OS
    const osStats = await LoginHistory.aggregate([
      { $match: filter },
      { $group: {
        _id: '$device.os',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 }}
    ]);

    // Get most active IPs
    const topIPs = await LoginHistory.aggregate([
      { $match: filter },
      { $group: {
        _id: '$ipAddress',
        count: { $sum: 1 },
        lastLogin: { $max: '$createdAt' }
      }},
      { $sort: { count: -1 }},
      { $limit: 10 }
    ]);

    // Get login activity by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyLogins = await LoginHistory.aggregate([
      { $match: { ...filter, createdAt: { $gte: sevenDaysAgo } }},
      { $group: {
        _id: { 
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }},
          status: '$loginStatus'
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.date': 1 }}
    ]);

    // Average session duration
    const avgSessionDuration = await LoginHistory.aggregate([
      { $match: { ...filter, sessionDuration: { $gt: 0 } }},
      { $group: {
        _id: null,
        avgDuration: { $avg: '$sessionDuration' }
      }}
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: statusStats,
        byDevice: deviceStats,
        byBrowser: browserStats,
        byOS: osStats,
        topIPs,
        dailyLogins,
        avgSessionDuration: avgSessionDuration[0]?.avgDuration || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's current active sessions
// @route   GET /api/login-history/active-sessions
// @access  Private
exports.getActiveSessions = async (req, res, next) => {
  try {
    const activeSessions = await LoginHistory.find({
      user: req.user.id,
      loginStatus: 'success',
      logoutAt: null
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activeSessions.length,
      data: activeSessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete old login history
// @route   DELETE /api/login-history/cleanup
// @access  Private/Admin
exports.cleanupOldHistory = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 90; // Default 90 days
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const result = await LoginHistory.deleteMany({
      createdAt: { $lt: dateThreshold }
    });

    res.status(200).json({
      success: true,
      message: `Deleted login history older than ${days} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

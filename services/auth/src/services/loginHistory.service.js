const LoginHistory = require('../models/LoginHistory.model');

/**
 * Parse user agent to extract device information
 */
const parseUserAgent = (userAgent) => {
  const device = {
    type: 'desktop',
    browser: 'unknown',
    os: 'unknown',
    platform: 'unknown'
  };

  if (!userAgent) return device;

  // Detect device type
  if (/mobile/i.test(userAgent)) {
    device.type = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device.type = 'tablet';
  }

  // Detect browser
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    device.browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    device.browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    device.browser = 'Safari';
  } else if (/edg/i.test(userAgent)) {
    device.browser = 'Edge';
  } else if (/opera|opr/i.test(userAgent)) {
    device.browser = 'Opera';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    device.os = 'Windows';
  } else if (/mac/i.test(userAgent)) {
    device.os = 'macOS';
  } else if (/linux/i.test(userAgent)) {
    device.os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    device.os = 'Android';
  } else if (/ios|iphone|ipad/i.test(userAgent)) {
    device.os = 'iOS';
  }

  // Detect platform
  if (/postman/i.test(userAgent)) {
    device.platform = 'Postman';
  } else if (/insomnia/i.test(userAgent)) {
    device.platform = 'Insomnia';
  } else {
    device.platform = 'Web Browser';
  }

  return device;
};

/**
 * Get IP address from request
 */
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip ||
         'unknown';
};

/**
 * Log login attempt
 */
const logLoginAttempt = async (data) => {
  try {
    const {
      userId,
      email,
      ipAddress,
      userAgent,
      loginStatus,
      failureReason
    } = data;

    const device = parseUserAgent(userAgent);

    const loginHistory = await LoginHistory.create({
      user: userId,
      email,
      ipAddress,
      userAgent,
      device,
      loginStatus,
      failureReason
    });

    return loginHistory;
  } catch (error) {
    console.error('Error logging login attempt:', error);
    return null;
  }
};

/**
 * Update logout time
 */
const logLogout = async (userId, ipAddress) => {
  try {
    // Find the last successful login
    const lastLogin = await LoginHistory.findOne({
      user: userId,
      loginStatus: 'success',
      logoutAt: null
    }).sort({ createdAt: -1 });

    if (lastLogin) {
      const sessionDuration = Math.floor((Date.now() - lastLogin.createdAt) / 1000 / 60); // minutes
      lastLogin.logoutAt = new Date();
      lastLogin.sessionDuration = sessionDuration;
      await lastLogin.save();
    }

    return lastLogin;
  } catch (error) {
    console.error('Error logging logout:', error);
    return null;
  }
};

module.exports = {
  parseUserAgent,
  getIpAddress,
  logLoginAttempt,
  logLogout
};

const jwt = require('jsonwebtoken');
const axios = require('axios');

// Get the auth service URL from environment
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token locally first
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Optionally verify user exists via auth service
      try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/users/${decoded.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        req.user = response.data.data || response.data;
      } catch (authError) {
        // If auth service is unavailable, use decoded token data
        console.warn('Auth service unavailable, using token data');
        req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

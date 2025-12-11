const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { validationResult } = require('express-validator');
const { logActivity } = require('../services/activity.service');
const { logLoginAttempt, getIpAddress } = require('../services/loginHistory.service');

// Generate JWT Token (includes id and role)
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    // Log activity
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    await logActivity({
      userId: user._id,
      action: 'user.register',
      description: `User registered: ${email}`,
      ipAddress,
      userAgent,
      metadata: { email, role: user.role }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Find user by email and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Log failed login attempt
      await logLoginAttempt({
        userId: null,
        email,
        ipAddress,
        userAgent,
        loginStatus: 'failed',
        failureReason: 'User not found'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      // Log blocked login attempt
      await logLoginAttempt({
        userId: user._id,
        email,
        ipAddress,
        userAgent,
        loginStatus: 'blocked',
        failureReason: 'Account deactivated'
      });

      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      // Log failed login attempt
      await logLoginAttempt({
        userId: user._id,
        email,
        ipAddress,
        userAgent,
        loginStatus: 'failed',
        failureReason: 'Incorrect password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Log successful login
    await logLoginAttempt({
      userId: user._id,
      email,
      ipAddress,
      userAgent,
      loginStatus: 'success'
    });

    // Log activity
    await logActivity({
      userId: user._id,
      action: 'user.login',
      description: `User logged in: ${email}`,
      ipAddress,
      userAgent,
      metadata: { email }
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      // Log failed password change attempt
      await logActivity({
        userId: user._id,
        action: 'password.change.failed',
        description: `Failed password change attempt: Incorrect current password`,
        ipAddress,
        userAgent,
        status: 'failed'
      });

      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log successful password change
    await logActivity({
      userId: user._id,
      action: 'password.change',
      description: `User changed password`,
      ipAddress,
      userAgent,
      metadata: { email: user.email }
    });

    // Generate new token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

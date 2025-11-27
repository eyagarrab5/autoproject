const User = require('../models/User.model');
const PasswordResetToken = require('../models/PasswordResetToken.model');
const emailService = require('../services/email.service');
const { logActivity } = require('../services/activity.service');
const crypto = require('crypto');

// Helper function to get IP address
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message (security: don't reveal if email exists)
    const successMessage = 'If an account with that email exists, a password reset link has been sent';

    if (!user) {
      return res.status(200).json({
        success: true,
        message: successMessage
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(200).json({
        success: true,
        message: successMessage
      });
    }

    // Delete any existing reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    // Generate reset token
    const resetToken = PasswordResetToken.generateToken();

    // Save token to database (will be hashed by the model's pre-save hook)
    await PasswordResetToken.create({
      user: user._id,
      token: resetToken,
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
    });

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);
      
      // Log password reset request
      const ipAddress = getIpAddress(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      await logActivity({
        userId: user._id,
        action: 'password.reset.request',
        description: `Password reset requested for ${user.email}`,
        ipAddress,
        userAgent,
        metadata: { email: user.email }
      });
    } catch (error) {
      // Delete the token if email fails
      await PasswordResetToken.deleteMany({ user: user._id });
      
      console.error('Email sending failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: successMessage,
      // Only include token in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      isUsed: false,
      expiresAt: { $gt: Date.now() }
    }).populate('user');

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Get the user
    const user = await User.findById(resetToken.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetToken.isUsed = true;
    await resetToken.save();

    // Delete all reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    // Log successful password reset
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    await logActivity({
      userId: user._id,
      action: 'password.reset.complete',
      description: `Password reset completed for ${user.email}`,
      ipAddress,
      userAgent,
      metadata: { email: user.email }
    });

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(user.email, user.name);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't fail the request if confirmation email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify reset token
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a token'
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      isUsed: false,
      expiresAt: { $gt: Date.now() }
    }).populate('user', 'email name');

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Calculate time remaining
    const timeRemaining = Math.floor((resetToken.expiresAt - Date.now()) / 1000 / 60); // in minutes
    
    // Format expiration time in GMT+1
    const expiresAtGMTPlus1 = new Date(resetToken.expiresAt.getTime() + (1 * 60 * 60 * 1000));
    const formattedExpiry = expiresAtGMTPlus1.toLocaleString('fr-FR', { 
      timeZone: 'Europe/Paris',
      dateStyle: 'short',
      timeStyle: 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: resetToken.user.email,
        expiresIn: `${timeRemaining} minutes`,
        expiresAt: formattedExpiry + ' (GMT+1)'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reset tokens for a user (Admin only)
// @route   GET /api/auth/reset-tokens/:userId
// @access  Private/Admin
exports.getUserResetTokens = async (req, res, next) => {
  try {
    const tokens = await PasswordResetToken.find({ user: req.params.userId })
      .populate('user', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all expired tokens (Admin only - cleanup)
// @route   DELETE /api/auth/reset-tokens/cleanup
// @access  Private/Admin
exports.cleanupExpiredTokens = async (req, res, next) => {
  try {
    const result = await PasswordResetToken.deleteMany({
      $or: [
        { expiresAt: { $lt: Date.now() } },
        { isUsed: true }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Expired tokens cleaned up successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

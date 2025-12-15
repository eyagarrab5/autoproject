const express = require('express');
const router = express.Router();
const User = require('../models/User.model');

// Internal route for service-to-service communication
// No authentication required - should only be accessible within the internal network

// Get user by ID (for other services)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Internal API - Error fetching user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all users (for other services)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Internal API - Error fetching users:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

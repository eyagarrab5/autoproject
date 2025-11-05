const Profile = require('../models/Profile.model');
const User = require('../models/User.model');
const { validationResult } = require('express-validator');

// @desc    Get current user's profile
// @route   GET /api/profile/me
// @access  Private
exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update current user's profile
// @route   POST /api/profile/me
// @access  Private
exports.createOrUpdateMyProfile = async (req, res, next) => {
  try {
    const {
      bio,
      avatar,
      phone,
      dateOfBirth,
      gender,
      address,
      socialLinks,
      preferences
    } = req.body;

    // Build profile object
    const profileFields = { user: req.user.id };
    if (bio !== undefined) profileFields.bio = bio;
    if (avatar) profileFields.avatar = avatar;
    if (phone) profileFields.phone = phone;
    if (dateOfBirth) profileFields.dateOfBirth = dateOfBirth;
    if (gender) profileFields.gender = gender;
    if (address) profileFields.address = address;
    if (socialLinks) profileFields.socialLinks = socialLinks;
    if (preferences) profileFields.preferences = preferences;

    // Check if profile exists and update, otherwise create
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile
      });
    }

    // Create new profile
    profile = await Profile.create(profileFields);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete current user's profile
// @route   DELETE /api/profile/me
// @access  Private
exports.deleteMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndDelete({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all profiles
// @route   GET /api/profile
// @access  Private/Admin
exports.getAllProfiles = async (req, res, next) => {
  try {
    const profiles = await Profile.find();

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile by user ID
// @route   GET /api/profile/user/:userId
// @access  Private/Admin
exports.getProfileByUserId = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    next(error);
  }
};

// @desc    Create profile for specific user
// @route   POST /api/profile/user/:userId
// @access  Private/Admin
exports.createProfileForUser = async (req, res, next) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ user: req.params.userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists for this user'
      });
    }

    const {
      bio,
      avatar,
      phone,
      dateOfBirth,
      gender,
      address,
      socialLinks,
      preferences
    } = req.body;

    const profileFields = {
      user: req.params.userId,
      bio,
      avatar,
      phone,
      dateOfBirth,
      gender,
      address,
      socialLinks,
      preferences
    };

    const profile = await Profile.create(profileFields);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    next(error);
  }
};

// @desc    Update profile for specific user
// @route   PUT /api/profile/user/:userId
// @access  Private/Admin
exports.updateProfileForUser = async (req, res, next) => {
  try {
    const {
      bio,
      avatar,
      phone,
      dateOfBirth,
      gender,
      address,
      socialLinks,
      preferences
    } = req.body;

    const profileFields = {};
    if (bio !== undefined) profileFields.bio = bio;
    if (avatar) profileFields.avatar = avatar;
    if (phone) profileFields.phone = phone;
    if (dateOfBirth) profileFields.dateOfBirth = dateOfBirth;
    if (gender) profileFields.gender = gender;
    if (address) profileFields.address = address;
    if (socialLinks) profileFields.socialLinks = socialLinks;
    if (preferences) profileFields.preferences = preferences;

    const profile = await Profile.findOneAndUpdate(
      { user: req.params.userId },
      { $set: profileFields },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found for this user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    next(error);
  }
};

// @desc    Delete profile for specific user
// @route   DELETE /api/profile/user/:userId
// @access  Private/Admin
exports.deleteProfileForUser = async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndDelete({ user: req.params.userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found for this user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
      data: {}
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    next(error);
  }
};

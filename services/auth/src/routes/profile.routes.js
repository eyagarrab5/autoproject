const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  createOrUpdateMyProfile,
  deleteMyProfile,
  getAllProfiles,
  getProfileByUserId,
  createProfileForUser,
  updateProfileForUser,
  deleteProfileForUser
} = require('../controllers/profile.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Current user profile routes (any authenticated user)
router.use(protect);

router
  .route('/me')
  .get(getMyProfile)
  .post(createOrUpdateMyProfile)
  .delete(deleteMyProfile);

// Admin routes for managing all profiles
router.use(authorize('admin'));

router
  .route('/')
  .get(getAllProfiles);

router
  .route('/user/:userId')
  .get(getProfileByUserId)
  .post(createProfileForUser)
  .put(updateProfileForUser)
  .delete(deleteProfileForUser);

module.exports = router;

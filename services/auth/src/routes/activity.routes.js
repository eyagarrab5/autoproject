const express = require('express');
const router = express.Router();
const {
  getMyActivityLogs,
  getAllActivityLogs,
  getActivityStats,
  cleanupOldLogs
} = require('../controllers/activity.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// User routes
router.get('/me', protect, getMyActivityLogs);

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllActivityLogs);
router.get('/stats', getActivityStats);
router.delete('/cleanup', cleanupOldLogs);

module.exports = router;

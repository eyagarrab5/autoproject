const express = require('express');
const router = express.Router();
const {
  getMyLoginHistory,
  getAllLoginHistory,
  getLoginStats,
  getActiveSessions,
  cleanupOldHistory
} = require('../controllers/loginHistory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// User routes
router.get('/me', protect, getMyLoginHistory);
router.get('/active-sessions', protect, getActiveSessions);

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllLoginHistory);
router.get('/stats', getLoginStats);
router.delete('/cleanup', cleanupOldHistory);

module.exports = router;

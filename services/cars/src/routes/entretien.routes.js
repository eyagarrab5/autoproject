const express = require('express');
const router = express.Router();
const entretienController = require('../controllers/entretien.controller');
const { validateEntretienCreate, validateEntretienUpdate } = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

// Public routes (optional auth for tracking)
router.get('/search', optionalAuth, entretienController.searchEntretiens);
router.get('/sort', optionalAuth, entretienController.sortEntretiens);
router.get('/stats', optionalAuth, entretienController.statsEntretiens);
router.get('/', optionalAuth, entretienController.getEntretiens);
router.get('/car/:carId', optionalAuth, entretienController.getEntretiensByCar);
router.get('/:id', optionalAuth, entretienController.getEntretienById);

// Protected routes (require authentication)
router.post('/', protect, validateEntretienCreate, entretienController.addEntretien);
router.post('/voiture/:matr', protect, entretienController.addEntretienByMatr);
router.put('/:id', protect, validateEntretienUpdate, entretienController.updateEntretien);
router.delete('/:id', protect, entretienController.deleteEntretien);

module.exports = router;

const express = require('express');
const router = express.Router();
const voitureController = require('../controllers/voiture.controller');
const { validateVoitureCreate, validateVoitureUpdate } = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

// Public routes (optional auth for tracking)
router.get('/search', optionalAuth, voitureController.searchVoitures);
router.get('/sort', optionalAuth, voitureController.sortVoitures);
router.get('/stats', optionalAuth, voitureController.statsVoitures);
router.get('/', optionalAuth, voitureController.getVoitures);
router.get('/plate/:matr', optionalAuth, voitureController.getVoitureByMatricule);
router.get('/:id', optionalAuth, voitureController.getVoitureById);

// Protected routes (require authentication)
router.post('/', protect, validateVoitureCreate, voitureController.addVoiture);
router.post('/echo', protect, voitureController.echo);
router.put('/:id', protect, validateVoitureUpdate, voitureController.updateVoiture);
router.delete('/:id', protect, voitureController.deleteVoiture);
router.delete('/plate/:matr', protect, voitureController.deleteVoitureByMatr);

module.exports = router;

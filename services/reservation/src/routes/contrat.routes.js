const express = require('express');
const router = express.Router();
const contratController = require('../controllers/contrat.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Get contract by number (useful for searching)
router.get('/numero/:numero', contratController.getContratByNumero);

// CRUD operations
router.route('/')
  .get(contratController.getContrats)
  .post(authorize('admin'), contratController.createContrat);

router.route('/:id')
  .get(contratController.getContrat)
  .put(authorize('admin'), contratController.updateContrat)
  .delete(authorize('admin'), contratController.deleteContrat);

// Sign contract
router.put('/:id/sign', contratController.signContrat);

// Close contract (end rental) - admin only
router.put('/:id/close', authorize('admin'), contratController.closeContrat);

// Regenerate PDF - admin only (with ID in URL)
router.post('/:id/regenerate-pdf', authorize('admin'), contratController.regeneratePDF);

// Regenerate PDF - admin only (with ID in body)
router.post('/regenerate-pdf', authorize('admin'), contratController.regeneratePDFByBody);

module.exports = router;

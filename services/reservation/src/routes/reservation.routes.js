const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Check availability (public for authenticated users)
router.get('/availability', reservationController.checkAvailability);

// Get reservations by voiture
router.get('/voiture/:voitureId', reservationController.getReservationsByVoiture);

// CRUD operations
router.route('/')
  .get(reservationController.getReservations)
  .post(reservationController.createReservation);

router.route('/:id')
  .get(reservationController.getReservation)
  .put(reservationController.updateReservation)
  .delete(authorize('admin'), reservationController.deleteReservation);

// Confirm reservation (admin only)
router.put('/:id/confirm', authorize('admin'), reservationController.confirmReservation);

module.exports = router;

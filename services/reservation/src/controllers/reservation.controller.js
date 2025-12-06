const Reservation = require('../models/reservation.model');
const externalService = require('../services/external.service');

/**
 * Create a new reservation
 */
exports.createReservation = async (req, res) => {
  try {
    const { voiture, dateDebut, dateFin, lieuRetrait, lieuRetour, montant, paiement, tarifJournalier } = req.body;
    const user = req.user.id;

    // Validate voiture exists and get its info
    const voitureInfo = await externalService.getVoitureById(voiture);
    if (!voitureInfo) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }

    // Check if voiture is available
    if (voitureInfo.etat && voitureInfo.etat !== 'available') {
      return res.status(400).json({ message: 'Cette voiture n\'est pas disponible' });
    }

    // Check for overlapping reservations
    const overlapping = await Reservation.findOne({
      voiture,
      statut: { $ne: 'annulée' },
      $or: [
        { dateDebut: { $lte: new Date(dateFin) }, dateFin: { $gte: new Date(dateDebut) } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ message: 'La voiture est déjà réservée pour cette période' });
    }

    const reservation = new Reservation({
      voiture,
      user,
      dateDebut,
      dateFin,
      lieuRetrait,
      lieuRetour,
      montant: montant || 0,
      tarifJournalier: tarifJournalier || voitureInfo.tarifJournalier || 0,
      paiement: paiement || 'carte',
      statut: 'en attente'
    });

    await reservation.save();

    // Update voiture status
    await externalService.updateVoitureStatus(voiture, 'rented', req.token);

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: reservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la réservation', error: error.message });
  }
};

/**
 * Get all reservations (admin) or user's reservations
 */
exports.getReservations = async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show user's reservations
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const reservations = await Reservation.find(query).sort({ createdAt: -1 });

    // Enrich with voiture and user info
    const enrichedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        const resObj = reservation.toObject();
        
        try {
          resObj.voitureInfo = await externalService.getVoitureById(reservation.voiture);
        } catch (e) {
          resObj.voitureInfo = null;
        }

        if (req.user.role === 'admin') {
          try {
            resObj.userInfo = await externalService.getUserById(reservation.user, req.token);
          } catch (e) {
            resObj.userInfo = null;
          }
        }

        return resObj;
      })
    );

    res.json({
      success: true,
      count: enrichedReservations.length,
      data: enrichedReservations
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
};

/**
 * Get single reservation by ID
 */
exports.getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check access
    if (req.user.role !== 'admin' && reservation.user !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const resObj = reservation.toObject();

    // Enrich with external data
    try {
      resObj.voitureInfo = await externalService.getVoitureById(reservation.voiture);
    } catch (e) {
      resObj.voitureInfo = null;
    }

    try {
      resObj.userInfo = await externalService.getUserById(reservation.user, req.token);
    } catch (e) {
      resObj.userInfo = null;
    }

    res.json({
      success: true,
      data: resObj
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la réservation', error: error.message });
  }
};

/**
 * Update reservation
 */
exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check access
    if (req.user.role !== 'admin' && reservation.user !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const allowedUpdates = ['dateDebut', 'dateFin', 'lieuRetrait', 'lieuRetour', 'statut', 'paiement', 'montant'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    // If reservation is cancelled, update voiture status
    if (updates.statut === 'annulée') {
      await externalService.updateVoitureStatus(reservation.voiture, 'available', req.token);
    }

    res.json({
      success: true,
      message: 'Réservation mise à jour',
      data: updatedReservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la réservation', error: error.message });
  }
};

/**
 * Delete reservation
 */
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seuls les admins peuvent supprimer les réservations' });
    }

    // Update voiture status before deleting
    await externalService.updateVoitureStatus(reservation.voiture, 'available', req.token);

    await Reservation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Réservation supprimée'
    });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la réservation', error: error.message });
  }
};

/**
 * Check availability for a voiture
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { voiture, dateDebut, dateFin } = req.query;

    if (!voiture || !dateDebut || !dateFin) {
      return res.status(400).json({ message: 'voiture, dateDebut et dateFin sont requis' });
    }

    const overlapping = await Reservation.findOne({
      voiture,
      statut: { $nin: ['annulée', 'terminée'] },
      $or: [
        { dateDebut: { $lte: new Date(dateFin) }, dateFin: { $gte: new Date(dateDebut) } }
      ]
    });

    res.json({
      success: true,
      available: !overlapping,
      message: overlapping ? 'La voiture n\'est pas disponible pour cette période' : 'La voiture est disponible'
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de disponibilité', error: error.message });
  }
};

/**
 * Get reservations by voiture
 */
exports.getReservationsByVoiture = async (req, res) => {
  try {
    const { voitureId } = req.params;

    const reservations = await Reservation.find({ voiture: voitureId }).sort({ dateDebut: -1 });

    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Get reservations by voiture error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
};

/**
 * Confirm reservation (admin only)
 */
exports.confirmReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    if (reservation.statut !== 'en attente') {
      return res.status(400).json({ message: 'Cette réservation ne peut pas être confirmée' });
    }

    reservation.statut = 'confirmée';
    await reservation.save();

    // Update voiture status
    await externalService.updateVoitureStatus(reservation.voiture, 'rented', req.token);

    res.json({
      success: true,
      message: 'Réservation confirmée',
      data: reservation
    });
  } catch (error) {
    console.error('Confirm reservation error:', error);
    res.status(500).json({ message: 'Erreur lors de la confirmation de la réservation', error: error.message });
  }
};

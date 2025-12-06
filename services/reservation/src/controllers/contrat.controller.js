const Contrat = require('../models/contrat.model');
const Reservation = require('../models/reservation.model');
const externalService = require('../services/external.service');
const { makePDF } = require('../utils/pdf');
const { sendContractEmail } = require('../utils/mailer');

/**
 * Create a new contract for a reservation
 */
exports.createContrat = async (req, res) => {
  try {
    const { reservationId, lieu, conditions, signataire } = req.body;

    // Get reservation
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check if contract already exists for this reservation
    const existingContrat = await Contrat.findOne({ reservation: reservationId });
    if (existingContrat) {
      return res.status(400).json({ message: 'Un contrat existe déjà pour cette réservation' });
    }

    // Check reservation status
    if (reservation.statut !== 'confirmée') {
      return res.status(400).json({ message: 'La réservation doit être confirmée pour créer un contrat' });
    }

    // Generate contract number
    const numero = `CTR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Get voiture and user info for the contract
    let voitureInfo = null;
    let userInfo = null;

    try {
      voitureInfo = await externalService.getVoitureById(reservation.voiture);
    } catch (e) {
      console.warn('Could not fetch voiture info:', e.message);
    }

    try {
      userInfo = await externalService.getUserById(reservation.user, req.token);
    } catch (e) {
      console.warn('Could not fetch user info:', e.message);
    }

    const contrat = new Contrat({
      reservation: reservationId,
      numero,
      lieu: lieu || 'Tunis',
      date: new Date(),
      montantTotal: reservation.montant,
      conditions: conditions || 'Conditions générales de location applicables.',
      statut: 'actif',
      signataire: signataire || userInfo?.name || 'Client'
    });

    await contrat.save();

    // Update reservation to mark it as having a contract
    reservation.statut = 'en cours';
    await reservation.save();

    // Generate PDF
    let pdfResult = null;
    try {
      const reservationWithInfo = {
        ...reservation.toObject(),
        voitureInfo,
        userInfo
      };
      pdfResult = await makePDF(contrat.toObject(), reservationWithInfo);
      
      // Update contrat with PDF path
      contrat.pdfPath = pdfResult.filePath;
      await contrat.save();
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError.message);
    }

    // Send email with contract
    if (userInfo?.email && pdfResult?.filePath) {
      try {
        await sendContractEmail(
          userInfo.email,
          `Contrat de location - ${numero}`,
          `Bonjour ${userInfo.name || ''},\n\nVeuillez trouver ci-joint votre contrat de location.\n\nCordialement,\nL'équipe Location Auto`,
          pdfResult.filePath
        );
      } catch (emailError) {
        console.error('Email send error:', emailError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Contrat créé avec succès',
      data: {
        ...contrat.toObject(),
        pdfGenerated: !!pdfResult,
        pdfFileName: pdfResult?.fileName
      }
    });
  } catch (error) {
    console.error('Create contrat error:', error);
    res.status(500).json({ message: 'Erreur lors de la création du contrat', error: error.message });
  }
};

/**
 * Get all contracts
 */
exports.getContrats = async (req, res) => {
  try {
    let query = {};

    // If not admin, only show user's contracts
    if (req.user.role !== 'admin') {
      // Find reservations belonging to user
      const userReservations = await Reservation.find({ userId: req.user.id }).select('_id');
      const reservationIds = userReservations.map(r => r._id);
      query.reservation = { $in: reservationIds };
    }

    const contrats = await Contrat.find(query)
      .populate('reservation')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: contrats.length,
      data: contrats
    });
  } catch (error) {
    console.error('Get contrats error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des contrats', error: error.message });
  }
};

/**
 * Get single contract by ID
 */
exports.getContrat = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id).populate('reservation');

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    // Check access
    if (req.user.role !== 'admin' && contrat.reservation?.user !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Enrich with external data
    const contratObj = contrat.toObject();
    
    if (contrat.reservation) {
      try {
        contratObj.reservation.voitureInfo = await externalService.getVoitureById(
          contrat.reservation.voiture
        );
      } catch (e) {
        contratObj.reservation.voitureInfo = null;
      }

      try {
        contratObj.reservation.userInfo = await externalService.getUserById(
          contrat.reservation.user, 
          req.token
        );
      } catch (e) {
        contratObj.reservation.userInfo = null;
      }
    }

    res.json({
      success: true,
      data: contratObj
    });
  } catch (error) {
    console.error('Get contrat error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du contrat', error: error.message });
  }
};

/**
 * Get contract by number
 */
exports.getContratByNumero = async (req, res) => {
  try {
    const contrat = await Contrat.findOne({ numero: req.params.numero }).populate('reservation');

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    res.json({
      success: true,
      data: contrat
    });
  } catch (error) {
    console.error('Get contrat by numero error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du contrat', error: error.message });
  }
};

/**
 * Update contract status
 */
exports.updateContrat = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id);

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    const allowedUpdates = ['statut', 'conditions', 'dateSignature', 'signataire'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedContrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('reservation');

    res.json({
      success: true,
      message: 'Contrat mis à jour',
      data: updatedContrat
    });
  } catch (error) {
    console.error('Update contrat error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du contrat', error: error.message });
  }
};

/**
 * Sign contract
 */
exports.signContrat = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id).populate('reservation');

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    if (contrat.statut !== 'actif') {
      return res.status(400).json({ message: 'Ce contrat ne peut pas être signé' });
    }

    contrat.dateSignature = new Date();
    contrat.signataire = req.body.signataire || req.user.name || 'Client';
    contrat.statut = 'signé';
    await contrat.save();

    res.json({
      success: true,
      message: 'Contrat signé avec succès',
      data: contrat
    });
  } catch (error) {
    console.error('Sign contrat error:', error);
    res.status(500).json({ message: 'Erreur lors de la signature du contrat', error: error.message });
  }
};

/**
 * Close contract (end rental)
 */
exports.closeContrat = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id).populate('reservation');

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    if (contrat.statut === 'clôturé') {
      return res.status(400).json({ message: 'Ce contrat est déjà clôturé' });
    }

    contrat.statut = 'clôturé';
    await contrat.save();

    // Update reservation status
    if (contrat.reservation) {
      const reservation = await Reservation.findById(contrat.reservation._id || contrat.reservation);
      if (reservation) {
        reservation.statut = 'terminée';
        await reservation.save();

        // Update voiture status to available
        await externalService.updateVoitureStatus(reservation.voiture, 'available', req.token);
      }
    }

    res.json({
      success: true,
      message: 'Contrat clôturé avec succès',
      data: contrat
    });
  } catch (error) {
    console.error('Close contrat error:', error);
    res.status(500).json({ message: 'Erreur lors de la clôture du contrat', error: error.message });
  }
};

/**
 * Delete contract (admin only)
 */
exports.deleteContrat = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id);

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    await Contrat.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Contrat supprimé'
    });
  } catch (error) {
    console.error('Delete contrat error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du contrat', error: error.message });
  }
};

/**
 * Regenerate PDF for a contract
 */
exports.regeneratePDF = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id).populate('reservation');

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    const reservation = contrat.reservation;
    if (!reservation) {
      return res.status(400).json({ message: 'Réservation associée non trouvée' });
    }

    // Get external info
    let voitureInfo = null;
    let userInfo = null;

    try {
      voitureInfo = await externalService.getVoitureById(reservation.voiture);
    } catch (e) {}

    try {
      userInfo = await externalService.getUserById(reservation.user, req.token);
    } catch (e) {}

    const reservationWithInfo = {
      ...reservation.toObject(),
      voitureInfo,
      userInfo
    };

    const pdfResult = await makePDF(contrat.toObject(), reservationWithInfo);

    contrat.pdfPath = pdfResult.filePath;
    await contrat.save();

    res.json({
      success: true,
      message: 'PDF régénéré avec succès',
      data: {
        fileName: pdfResult.fileName,
        filePath: pdfResult.filePath
      }
    });
  } catch (error) {
    console.error('Regenerate PDF error:', error);
    res.status(500).json({ message: 'Erreur lors de la régénération du PDF', error: error.message });
  }
};

/**
 * Regenerate PDF for a contract (ID in body)
 */
exports.regeneratePDFByBody = async (req, res) => {
  try {
    const { contratId } = req.body;

    if (!contratId) {
      return res.status(400).json({ message: 'contratId est requis dans le body' });
    }

    const contrat = await Contrat.findById(contratId).populate('reservation');

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    const reservation = contrat.reservation;
    if (!reservation) {
      return res.status(400).json({ message: 'Réservation associée non trouvée' });
    }

    // Get external info
    let voitureInfo = null;
    let userInfo = null;

    try {
      voitureInfo = await externalService.getVoitureById(reservation.voiture);
    } catch (e) {}

    try {
      userInfo = await externalService.getUserById(reservation.user, req.token);
    } catch (e) {}

    const reservationWithInfo = {
      ...reservation.toObject(),
      voitureInfo,
      userInfo
    };

    const pdfResult = await makePDF(contrat.toObject(), reservationWithInfo);

    contrat.pdfPath = pdfResult.filePath;
    await contrat.save();

    res.json({
      success: true,
      message: 'PDF régénéré avec succès',
      data: {
        fileName: pdfResult.fileName,
        filePath: pdfResult.filePath
      }
    });
  } catch (error) {
    console.error('Regenerate PDF error:', error);
    res.status(500).json({ message: 'Erreur lors de la régénération du PDF', error: error.message });
  }
};

const Reservation = require("../models/reservation.model");
const { authService, carsService } = require("../services/serviceClients");

// Helper function to populate reservation with external data
async function populateReservation(reservation) {
  const [voiture, user] = await Promise.all([
    carsService.getVoitureById(reservation.voiture),
    authService.getUserById(reservation.user)
  ]);
  
  return {
    ...reservation.toObject(),
    voiture: voiture || { _id: reservation.voiture, error: 'Car not found' },
    user: user || { _id: reservation.user, error: 'User not found' }
  };
}

// Helper function to populate multiple reservations
async function populateReservations(reservations) {
  return Promise.all(reservations.map(populateReservation));
}

// Helper function to calculate amount based on car tariff
async function calculateAmount(voitureId, dateDebut, dateFin) {
  const voiture = await carsService.getVoitureById(voitureId);
  if (!voiture || !voiture.tarifJournalier) {
    return 0;
  }
  
  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
  
  return voiture.tarifJournalier * diffDays;
}

exports.create = async (req, res) => {
  try {
    const { voiture, user, dateDebut, dateFin } = req.body;
    
    // Verify that the car exists in cars-service
    const voitureData = await carsService.getVoitureById(voiture);
    if (!voitureData) {
      return res.status(400).json({ error: "Voiture non trouvée dans le service cars" });
    }
    
    // Verify that the user exists in auth-service
    const userData = await authService.getUserById(user);
    if (!userData) {
      return res.status(400).json({ error: "Utilisateur non trouvé dans le service auth" });
    }
    
    // Calculate amount if not provided
    if (!req.body.montant || req.body.montant === 0) {
      req.body.montant = await calculateAmount(voiture, dateDebut, dateFin);
    }
    
    const r = await Reservation.create(req.body);
    
    // Return populated reservation
    const populatedReservation = await populateReservation(r);
    res.status(201).json(populatedReservation);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const reservations = await Reservation.find();
    const populatedReservations = await populateReservations(reservations);
    res.json(populatedReservations);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Récupérer une réservation par son ID
exports.getById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    const populatedReservation = await populateReservation(reservation);
    res.json(populatedReservation);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Lister les réservations d'un utilisateur
exports.listByUser = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.params.userId });
    const populatedReservations = await populateReservations(reservations);
    res.json(populatedReservations);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Lister les réservations d'une voiture
exports.listByVoiture = async (req, res) => {
  try {
    const reservations = await Reservation.find({ voiture: req.params.voitureId });
    const populatedReservations = await populateReservations(reservations);
    res.json(populatedReservations);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Mettre à jour une réservation
exports.update = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    const newDateDebut = req.body.dateDebut || reservation.dateDebut;
    const newDateFin = req.body.dateFin || reservation.dateFin;
    
    reservation.dateDebut = newDateDebut;
    reservation.dateFin = newDateFin;
    
    // Recalcul du montant using cars-service
    reservation.montant = await calculateAmount(reservation.voiture, newDateDebut, newDateFin);

    // Validation de l'indisponibilité de la voiture
    const reservationsExistantes = await Reservation.find({
      _id: { $ne: reservation._id },
      voiture: reservation.voiture,
      statut: { $nin: ['annulée', 'terminée'] },
      $or: [
        { 
          dateDebut: { $lte: newDateFin },
          dateFin: { $gte: newDateDebut }
        }
      ]
    });

    if (reservationsExistantes.length > 0) {
      return res.status(400).json({ error: "La voiture est déjà réservée pour cette période" });
    }

    if (req.body.statut) reservation.statut = req.body.statut;
    if (req.body.paiement) reservation.paiement = req.body.paiement;
    if (req.body.lieuRetrait) reservation.lieuRetrait = req.body.lieuRetrait;
    if (req.body.lieuRetour) reservation.lieuRetour = req.body.lieuRetour;
    if (req.body.commentaires) reservation.commentaires = req.body.commentaires;

    await reservation.save();
    
    const populatedReservation = await populateReservation(reservation);
    res.json(populatedReservation);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Annuler une réservation
exports.cancel = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    reservation.statut = "annulée";
    await reservation.save();
    
    const populatedReservation = await populateReservation(reservation);
    res.json(populatedReservation);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Vérifier la disponibilité d'une voiture
exports.availability = async (req, res) => {
  const { voitureId, dateDebut, dateFin } = req.body;

  try {
    // Verify car exists in cars-service
    const voiture = await carsService.getVoitureById(voitureId);
    if (!voiture) {
      return res.status(400).json({ error: "Voiture non trouvée" });
    }

    const dateDebutParsed = new Date(dateDebut);
    const dateFinParsed = new Date(dateFin);

    if (dateDebutParsed >= dateFinParsed) {
      return res.status(400).json({ error: "La date de début doit être antérieure à la date de fin" });
    }

    const reservationsExistantes = await Reservation.find({
      voiture: voitureId,
      statut: { $nin: ['annulée', 'terminée'] },
      $or: [
        { 
          dateDebut: { $lte: dateFin },
          dateFin: { $gte: dateDebut }
        }
      ]
    });

    if (reservationsExistantes.length > 0) {
      return res.status(400).json({ 
        available: false,
        error: "La voiture n'est pas disponible pour cet intervalle",
        conflictingReservations: reservationsExistantes.length
      });
    }

    res.json({ 
      available: true,
      voiture: voiture,
      estimatedAmount: await calculateAmount(voitureId, dateDebut, dateFin)
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

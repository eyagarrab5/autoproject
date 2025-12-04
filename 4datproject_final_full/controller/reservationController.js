const Reservation = require("../model/reservation");

exports.create = async (req, res) => {
  try {
    const r = await Reservation.create(req.body);
    res.status(201).json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  const list = await Reservation.find().populate("voiture").populate("user");
  res.json(list);
};

// Récupérer une réservation par son ID
exports.getById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("voiture")
      .populate("user");
    
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    res.json(reservation);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Lister les réservations d'un utilisateur
exports.listByUser = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.params.userId })
      .populate("voiture")
      .populate("user");

    res.json(reservations);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Lister les réservations d'une voiture
exports.listByVoiture = async (req, res) => {
  try {
    const reservations = await Reservation.find({ voiture: req.params.voitureId })
      .populate("voiture")
      .populate("user");

    res.json(reservations);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Mettre à jour une réservation (recalcul du montant et validation de l'indisponibilité)
exports.update = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    // Mise à jour des informations de la réservation avec les nouvelles données
    reservation.dateDebut = req.body.dateDebut || reservation.dateDebut;
    reservation.dateFin = req.body.dateFin || reservation.dateFin;
    
    // Recalcul du montant
    const dateDebut = new Date(reservation.dateDebut);
    const dateFin = new Date(reservation.dateFin);
    const differenceInTime = dateFin.getTime() - dateDebut.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    const tarifJournalier = reservation.voiture.tarifJournalier;

    reservation.montant = tarifJournalier * differenceInDays;

    // Validation de l'indisponibilité de la voiture pour la nouvelle période
    const reservationsExistantes = await Reservation.find({
      voiture: reservation.voiture._id,
      $or: [
        { dateDebut: { $lt: reservation.dateFin } },
        { dateFin: { $gt: reservation.dateDebut } }
      ]
    });

    if (reservationsExistantes.length > 0) {
      return res.status(400).json({ error: "La voiture est déjà réservée pour cette période" });
    }

    // Sauvegarder la réservation mise à jour
    await reservation.save();
    res.json(reservation);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Annuler une réservation (soft delete avec mise à jour du statut)
exports.cancel = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    // Mise à jour du statut à "cancelled"
    reservation.statut = "annulée";

    await reservation.save();
    res.json(reservation);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

// Vérifier la disponibilité d'une voiture pour un intervalle donné
exports.availability = async (req, res) => {
  const { voitureId, dateDebut, dateFin } = req.body;

  try {
    // Vérification des dates
    const dateDebutParsed = new Date(dateDebut);
    const dateFinParsed = new Date(dateFin);

    if (dateDebutParsed >= dateFinParsed) {
      return res.status(400).json({ error: "La date de début doit être antérieure à la date de fin" });
    }

    // Vérification de la disponibilité
    const reservationsExistantes = await Reservation.find({
      voiture: voitureId,
      $or: [
        { dateDebut: { $lt: dateFinParsed } },
        { dateFin: { $gt: dateDebutParsed } }
      ]
    });

    if (reservationsExistantes.length > 0) {
      return res.status(400).json({ error: "La voiture n'est pas disponible pour cet intervalle" });
    }

    res.json({ available: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
};

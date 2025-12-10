const Contrat = require("../models/contrat.model");
const Reservation = require("../models/reservation.model");
const { makePDF } = require("../services/pdf.service");
const { sendContractEmail } = require("../services/email.service");
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

// Helper function to populate contrat with reservation and external data
async function populateContrat(contrat) {
  const reservation = await Reservation.findById(contrat.reservation);
  if (!reservation) {
    return {
      ...contrat.toObject(),
      reservation: { _id: contrat.reservation, error: 'Reservation not found' }
    };
  }
  
  const populatedReservation = await populateReservation(reservation);
  return {
    ...contrat.toObject(),
    reservation: populatedReservation
  };
}

// ---------------------------------------
// 📌 Créer un contrat + générer PDF + envoyer email
// ---------------------------------------
exports.create = async (req, res) => {
  try {
    if (!req.body.reservation) {
      return res.status(400).json({ error: "Données manquantes pour la création du contrat" });
    }

    // 1️⃣ Création du contrat
    const contrat = await Contrat.create(req.body);

    // 2️⃣ Récupération de la réservation + utilisateur from external services
    const reservation = await Reservation.findById(contrat.reservation);

    if (!reservation) {
      return res.status(400).json({ error: "Réservation introuvable" });
    }

    // Get user from auth-service
    const user = await authService.getUserById(reservation.user);
    if (!user) {
      return res.status(400).json({ error: "Utilisateur introuvable dans le service auth" });
    }

    // Create populated reservation object for PDF
    const populatedReservation = {
      ...reservation.toObject(),
      user: user
    };

    // 3️⃣ PDF PRO avec contrat + réservation
    const { filePath, fileName } = await makePDF(contrat, populatedReservation);

    // 4️⃣ Infos du client
    const userEmail = user.email;
    const userName = user.name || "Client";

    const subject = "Votre contrat de location";
    const text = `Bonjour ${userName},

Veuillez trouver ci-joint votre contrat de location numéro ${contrat.numero}.

Merci pour votre confiance.
Agence de location.`;

    // 5️⃣ Envoi email
    await sendContractEmail(userEmail, subject, text, filePath);

    // 6️⃣ Réponse finale
    const populatedContrat = await populateContrat(contrat);
    res.status(201).json({
      contrat: populatedContrat,
      pdfPath: filePath,
      pdfUrl: `/files/${fileName}`,
      emailSentTo: userEmail,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// ---------------------------------------
// 📌 Liste de tous les contrats
// ---------------------------------------
exports.list = async (req, res) => {
  try {
    const contrats = await Contrat.find();
    const populatedContrats = await Promise.all(contrats.map(populateContrat));
    res.json(populatedContrats);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ---------------------------------------
// 📌 Récupérer un contrat par ID
// ---------------------------------------
exports.getById = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id);

    if (!contrat) return res.status(404).json({ error: "Contrat introuvable" });

    const populatedContrat = await populateContrat(contrat);
    res.json(populatedContrat);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ---------------------------------------
// 📌 Récupérer un contrat par numéro
// ---------------------------------------
exports.getByNumero = async (req, res) => {
  try {
    const contrat = await Contrat.findOne({ numero: req.params.numero });

    if (!contrat) return res.status(404).json({ error: "Contrat introuvable avec ce numéro" });

    const populatedContrat = await populateContrat(contrat);
    res.json(populatedContrat);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ---------------------------------------
// 📌 Mettre à jour un contrat
// ---------------------------------------
exports.update = async (req, res) => {
  try {
    const contrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!contrat) return res.status(404).json({ error: "Contrat introuvable" });

    res.json({
      message: "Contrat mis à jour avec succès",
      contrat
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ---------------------------------------
// 📌 Annuler un contrat
// ---------------------------------------
exports.cancel = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id);

    if (!contrat) return res.status(404).json({ error: "Contrat introuvable" });

    contrat.status = "annulé"; // s'assurer que le champ existe dans le modèle
    await contrat.save();

    res.json({
      message: "Contrat annulé avec succès",
      contrat
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

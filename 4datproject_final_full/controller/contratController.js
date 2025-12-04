const Contrat = require("../model/contrat");
const Reservation = require("../model/reservation");
const { makePDF } = require("../utils/pdf");

const { sendContractEmail } = require("../utils/mailer");

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

    // 2️⃣ Récupération de la réservation + utilisateur
    const reservation = await Reservation.findById(contrat.reservation).populate("user");

    if (!reservation) {
      return res.status(400).json({ error: "Réservation introuvable" });
    }

    // 3️⃣ PDF PRO avec contrat + réservation
    const { filePath, fileName } = await makePDF(contrat, reservation);

    // 4️⃣ Infos du client
    const userEmail = reservation.user.email;
    const userName = reservation.user.name || "Client";

    const subject = "Votre contrat de location";
    const text = `Bonjour ${userName},

Veuillez trouver ci-joint votre contrat de location numéro ${contrat.numero}.

Merci pour votre confiance.
Agence de location.`;

    // 5️⃣ Envoi email
    await sendContractEmail(userEmail, subject, text, filePath);

    // 6️⃣ Réponse finale
    res.status(201).json({
      contrat,
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
    const list = await Contrat.find().populate("reservation");
    res.json(list);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ---------------------------------------
// 📌 Récupérer un contrat par ID
// ---------------------------------------
exports.getById = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id)
      .populate({
        path: "reservation",
        populate: { path: "user" }
      });

    if (!contrat) return res.status(404).json({ error: "Contrat introuvable" });

    res.json(contrat);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ---------------------------------------
// 📌 Récupérer un contrat par numéro
// ---------------------------------------
exports.getByNumero = async (req, res) => {
  try {
    const contrat = await Contrat.findOne({ numero: req.params.numero })
      .populate({
        path: "reservation",
        populate: { path: "user" }
      });

    if (!contrat) return res.status(404).json({ error: "Contrat introuvable avec ce numéro" });

    res.json(contrat);
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

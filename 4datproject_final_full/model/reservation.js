const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  voiture: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Voiture", 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  dateDebut: { 
    type: String, 
    trim: true, 
    required: true 
  },
  dateFin: { 
    type: String, 
    trim: true, 
    required: true 
  },
  statut: {
    type: String,
    enum: ['en attente', 'confirmée', 'annulée', 'terminée'],
    default: 'en attente'
  },
  paiement: {
    type: String,
    enum: ['carte', 'virement', 'espèces'],
    required: true
  },
  montant: {
    type: Number,
    required: true,
    default: 0 // Initialisation du montant
  },
  dateReservation: {
    type: Date,
    default: Date.now
  },
  lieuRetrait: {
    type: String,
    trim: true,
    required: true
  },
  lieuRetour: {
    type: String,
    trim: true,
    required: true
  },
  commentaires: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Calcul automatique du montant avant sauvegarde
reservationSchema.pre('save', function(next) {
  // Calcul du nombre de jours entre la date de début et la date de fin
  const dateDebut = new Date(this.dateDebut);
  const dateFin = new Date(this.dateFin);
  const differenceInTime = dateFin.getTime() - dateDebut.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);

  // Si la voiture a un tarif journalier (ajouter un tarif à la collection Voiture)
  const tarifJournalier = this.voiture.tarifJournalier; // Assurez-vous que le modèle "Voiture" a un champ "tarifJournalier"

  // Calcul du montant total
  this.montant = tarifJournalier * differenceInDays;

  // Continuer avec la sauvegarde
  next();
});

module.exports = mongoose.model("Reservation", reservationSchema);

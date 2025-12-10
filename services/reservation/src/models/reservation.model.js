const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  // Reference to car in cars-service (stored as string ID)
  voiture: { 
    type: String, 
    required: true 
  },
  // Reference to user in auth-service (stored as string ID)
  user: { 
    type: String, 
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
    default: 0
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

module.exports = mongoose.model("Reservation", reservationSchema);

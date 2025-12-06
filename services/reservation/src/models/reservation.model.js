const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  // Reference to voiture in cars-service (stored as string ID for cross-service reference)
  voiture: { 
    type: String,
    required: [true, 'Voiture ID is required']
  },
  // Reference to user in auth-service (stored as string ID for cross-service reference)
  user: { 
    type: String,
    required: [true, 'User ID is required']
  },
  dateDebut: { 
    type: Date, 
    required: [true, 'Start date is required']
  },
  dateFin: { 
    type: Date, 
    required: [true, 'End date is required']
  },
  statut: {
    type: String,
    enum: ['en attente', 'confirmée', 'annulée', 'terminée'],
    default: 'en attente'
  },
  paiement: {
    type: String,
    enum: ['carte', 'virement', 'espèces'],
    required: [true, 'Payment method is required']
  },
  montant: {
    type: Number,
    required: true,
    default: 0
  },
  tarifJournalier: {
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
    required: [true, 'Pickup location is required']
  },
  lieuRetour: {
    type: String,
    trim: true,
    required: [true, 'Return location is required']
  },
  commentaires: {
    type: String,
    trim: true
  },
  // Cached data from other services for display purposes
  voitureInfo: {
    matricule: String,
    marque: String,
    modele: String
  },
  userInfo: {
    name: String,
    email: String
  }
}, { 
  timestamps: true 
});

// Calculate amount before saving
reservationSchema.pre('save', function(next) {
  if (this.dateDebut && this.dateFin && this.tarifJournalier) {
    const dateDebut = new Date(this.dateDebut);
    const dateFin = new Date(this.dateFin);
    const differenceInTime = dateFin.getTime() - dateDebut.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    this.montant = this.tarifJournalier * differenceInDays;
  }
  next();
});

// Virtual for number of days
reservationSchema.virtual('nombreJours').get(function() {
  if (this.dateDebut && this.dateFin) {
    const dateDebut = new Date(this.dateDebut);
    const dateFin = new Date(this.dateFin);
    const differenceInTime = dateFin.getTime() - dateDebut.getTime();
    return Math.ceil(differenceInTime / (1000 * 3600 * 24));
  }
  return 0;
});

reservationSchema.set('toJSON', { virtuals: true });
reservationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reservation', reservationSchema);

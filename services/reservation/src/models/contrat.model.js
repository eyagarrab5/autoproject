const mongoose = require('mongoose');

const contratSchema = new mongoose.Schema({
  reservation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reservation', 
    required: [true, 'Reservation ID is required']
  },
  numero: { 
    type: String, 
    required: [true, 'Contract number is required'],
    trim: true, 
    unique: true, 
    match: [/^[A-Za-z0-9-]+$/, 'Contract number must be alphanumeric']
  },
  lieu: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true 
  },
  date: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  montantTotal: { 
    type: Number, 
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  conditions: { 
    type: String, 
    trim: true,
    default: 'Standard rental terms and conditions apply. The renter agrees to return the vehicle in the same condition as received. Any damage will be charged to the renter.'
  },
  statut: { 
    type: String, 
    enum: ['actif', 'terminé', 'annulé'], 
    default: 'actif' 
  },
  signataire: { 
    type: String, 
    required: [true, 'Signatory name is required'],
    trim: true 
  },
  dateSignature: { 
    type: Date 
  },
  pdfPath: {
    type: String
  },
  pdfUrl: {
    type: String
  }
}, { 
  timestamps: true 
});

// Generate unique contract number before saving
contratSchema.pre('save', function(next) {
  if (!this.numero) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.numero = `CTR-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Contrat', contratSchema);

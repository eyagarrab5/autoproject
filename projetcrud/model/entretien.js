const mongoose = require('mongoose');
const schema = mongoose.Schema;
const Voiture = require('./voiture');

// définition du schéma Entretien (Maintenance)
const EntretienSchema = new schema({
  car: {
    type: String,
    ref: 'voiture',
    required: true,
    validate: {
      validator: function(v) { return typeof v === 'string' && v.length >= 1 && v.length <= 100; },
      message: "L'ID de la voiture doit être une chaîne valide"
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['routine', 'reparation', 'inspection', 'autre'],
    validate: {
      validator: function(v) { return ['routine', 'reparation', 'inspection', 'autre'].includes(v); },
      message: 'Le type de maintenance doit être valide'
    }
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        if (!v) return false;
        const inputDate = new Date(v);
        if (isNaN(inputDate.getTime())) return false;
        const maxDate = new Date('2025-12-31');
        return inputDate <= maxDate && inputDate.getFullYear() <= 2025;
      },
      message: 'La date doit être en 2025 ou avant'
    }
  },
  description: {
    type: String,
    validate: {
      validator: function(v) { if (!v) return true; return typeof v === 'string' && v.length >= 0 && v.length <= 1000; },
      message: 'La description ne doit pas dépasser 1000 caractères'
    }
  },
  cout: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) { return typeof v === 'number' && v >= 0 && v <= 1000000; },
      message: 'Le coût doit être un nombre positif raisonnable'
    }
  },
  piecesReconditionneesPct: {
    type: Number,
    min: 0,
    max: 100,
    validate: {
      validator: function(v) { if (v == null) return true; return Number.isInteger(v) && v >= 0 && v <= 100; },
      message: 'Le pourcentage de pièces reconditionnées doit être entre 0 et 100'
    }
  },
  dechetsKg: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v) { if (v == null) return true; return v >= 0 && v <= 1000; },
      message: 'Le poids des déchets doit être positif et raisonnable'
    }
  },
  createdAt: {
    type: String,
    validate: {
      validator: function(v) { if (!v) return true; const d = new Date(v); const now = new Date(); return !isNaN(d.getTime()) && d <= now; },
      message: "La date de création ne peut pas être dans le futur"
    }
  },
  updatedAt: {
    type: String,
    validate: {
      validator: function(v) { if (!v) return true; const d = new Date(v); const now = new Date(); return !isNaN(d.getTime()) && d <= now; },
      message: "La date de modification ne peut pas être dans le futur"
    }
  }
}, { versionKey: false });

function todayStr() {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const d = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

EntretienSchema.pre('save', async function(next) {
  try {
    if (this.car != null) {
      this.car = String(this.car).trim().toUpperCase();
    }
    const now = todayStr();
    if (this.isNew && !this.createdAt) this.createdAt = now;
    this.updatedAt = now;
    next();
  } catch (e) {
    next(e);
  }
});

EntretienSchema.pre('findOneAndUpdate', function(next) {
  try {
    const u = this.getUpdate();
    if (u && u.car != null) {
      u.car = String(u.car).trim().toUpperCase();
      this.set(u);
    }
    this.set({ updatedAt: todayStr() });
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.model('entretien', EntretienSchema);


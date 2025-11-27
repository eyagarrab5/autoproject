const mongoose = require('mongoose');
const schema = mongoose.Schema;

// définition du schéma Voiture (Car)
const VoitureSchema = new schema({
    _id: {
      type: String,
      required: true,
      validate: {
        validator: function(v) { return typeof v === 'string' && v.length >= 1 && v.length <= 50; },
        message: "L'ID doit être une chaîne valide"
      }
    },
    marque: {
      type: String,
      required: true,
      validate: {
        validator: function(v) { return typeof v === 'string' && v.length >= 1 && v.length <= 50 && /^[a-zA-Z0-9\s\-]+$/.test(v); },
        message: 'La marque doit contenir uniquement des caractères alphanumériques'
      }
    },
    modele: {
      type: String,
      required: true,
      validate: {
        validator: function(v) { return typeof v === 'string' && v.length >= 1 && v.length <= 50; },
        message: 'Le modèle doit être une chaîne valide'
      }
    },
    annee: {
      type: Number,
      validate: {
        validator: function(v) { if (v == null) return true; return v >= 1900 && v <= 2025; },
        message: "L'année doit être entre 1900 et 2025"
      }
    },
    carburant: {
      type: String,
      required: true,
      enum: ['essence', 'diesel', 'hybride', 'electrique'],
      validate: {
        validator: function(v) { return ['essence', 'diesel', 'hybride', 'electrique'].includes(v); },
        message: 'Le type de carburant doit être valide'
      }
    },
    kilometrage: {
      type: Number,
      default: 0,
      validate: {
        validator: function(v) { if (v == null) return true; return v >= 0 && v <= 1000000; },
        message: 'Le kilométrage doit être positif et raisonnable'
      }
    },
    etat: {
      type: String,
      enum: ['available', 'rented', 'maintenance', 'unavailable'],
      default: 'available',
      validate: {
        validator: function(v) { if (v == null) return true; return ['available', 'rented', 'maintenance', 'unavailable'].includes(v); },
        message: "L'état doit être valide"
      }
    },
    tarifJournalier: {
      type: Number,
      validate: {
        validator: function(v) { if (v == null) return true; return v >= 0 && v <= 10000; },
        message: 'Le tarif journalier doit être positif et raisonnable'
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

VoitureSchema.pre('save', async function(next) {
  try {
    if (this._id != null) {
      this._id = String(this._id).trim().toUpperCase();
    }
    const now = todayStr();
    if (this.isNew && !this.createdAt) this.createdAt = now;
    this.updatedAt = now;
    next();
  } catch (e) {
    next(e);
  }
});

VoitureSchema.pre('findOneAndUpdate', function(next) {
  try {
    const u = this.getUpdate();
    if (u && u._id != null) {
      u._id = String(u._id).trim().toUpperCase();
      this.set(u);
    }
    this.set({ updatedAt: todayStr() });
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.model('voiture', VoitureSchema);

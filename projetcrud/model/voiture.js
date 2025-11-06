const mongoose = require('mongoose');
const schema = mongoose.Schema;

// définition du schéma Voiture (Car)
const VoitureSchema = new schema({
    _id: { type: String, required: true },
    marque: { type: String, required: true },
    modele: { type: String, required: true },
    annee: { type: Number },
    carburant: { type: String, required: true, enum: ['essence', 'diesel', 'hybride', 'electrique'] },
    kilometrage: { type: Number, default: 0 },
    etat: { type: String, enum: ['available', 'rented', 'maintenance', 'unavailable'], default: 'available' },
    tarifJournalier: { type: Number },
    createdAt: { type: String },
    updatedAt: { type: String }
}, { versionKey: false });

function todayStr() {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const d = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

async function getNext(seqName) {
  return null;
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

// export du modèle
module.exports = mongoose.model('voiture', VoitureSchema);

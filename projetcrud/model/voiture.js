const mongoose = require('mongoose');
const schema = mongoose.Schema;
const Counter = require('./counter');

// définition du schéma Voiture (Car)
const VoitureSchema = new schema({
    _id: { type: Number },
    matr: { type: String, required: true, unique: true },
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
  const c = await Counter.findByIdAndUpdate(seqName, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}

VoitureSchema.pre('save', async function(next) {
  try {
    if (this.isNew && (this._id === undefined || this._id === null)) {
      this._id = await getNext('voiture');
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
    this.set({ updatedAt: todayStr() });
    next();
  } catch (e) { next(e); }
});

// export du modèle
module.exports = mongoose.model('voiture', VoitureSchema);

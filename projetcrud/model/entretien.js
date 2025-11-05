const mongoose = require('mongoose');
const schema = mongoose.Schema;
const Counter = require('./counter');
const Voiture = require('./voiture');

// définition du schéma Entretien (Maintenance)
const EntretienSchema = new schema({
  _id: { type: Number },
  car: { type: Number, ref: 'voiture', required: true },
  type: { type: String, required: true, enum: ['routine', 'reparation', 'inspection', 'autre'] },
  date: { type: String, required: true },
  description: { type: String },
  cout: { type: Number, required: true },
  piecesReconditionneesPct: { type: Number, min: 0, max: 100 },
  dechetsKg: { type: Number, min: 0 },
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

EntretienSchema.pre('save', async function(next) {
  try {
    if (this.isNew && (this._id === undefined || this._id === null)) {
      this._id = await getNext('entretien');
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
    this.set({ updatedAt: todayStr() });
    next();
  } catch (e) { next(e); }
});

module.exports = mongoose.model('entretien', EntretienSchema);

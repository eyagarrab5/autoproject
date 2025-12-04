const mongoose = require("mongoose");

const voitureSchema = new mongoose.Schema({
  mat: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  marque: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model("Voiture", voitureSchema);

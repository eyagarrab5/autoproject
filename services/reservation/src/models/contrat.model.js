const mongoose = require("mongoose");

const contratSchema = new mongoose.Schema(
  {
    reservation: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Reservation", 
      required: true 
    },
    numero: { 
      type: String, 
      required: true, 
      trim: true, 
      unique: true, 
      match: [/^[A-Za-z0-9-]+$/, "Le numéro de contrat doit être alphanumérique"] 
    },
    lieu: { 
      type: String, 
      required: true, 
      trim: true 
    },
    date: { 
      type: Date, 
      required: true, 
      default: Date.now 
    },
    montantTotal: { 
      type: Number, 
      required: true, 
      min: [0, "Le montant total ne peut pas être négatif"] 
    },
    conditions: { 
      type: String, 
      trim: true 
    },
    statut: { 
      type: String, 
      enum: ["actif", "terminé", "annulé"], 
      default: "actif" 
    },
    signataire: { 
      type: String, 
      required: true, 
      trim: true 
    },
    dateSignature: { 
      type: Date 
    }
  }, 
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Contrat", contratSchema);

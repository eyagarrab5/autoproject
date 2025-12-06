const Voiture = require('../models/voiture.model');

// Create a new voiture
exports.addVoiture = async (req, res) => {
  try {
    console.log('addVoiture received body:', req.body);
    
    const voiture = new Voiture(req.body);
    await voiture.save();
    res.status(201).json(voiture);
  } catch (err) {
    console.log(err);
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Car already exists', keyValue: err.keyValue });
    }
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all voitures
exports.getVoitures = async (req, res) => {
  try {
    const voitures = await Voiture.find();
    res.status(200).json(voitures);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get voiture by ID
exports.getVoitureById = async (req, res) => {
  try {
    const voiture = await Voiture.findById(req.params.id);
    if (!voiture) {
      return res.status(404).json({ message: 'Voiture not found' });
    }
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get voiture by matricule
exports.getVoitureByMatricule = async (req, res) => {
  try {
    const voiture = await Voiture.findOne({ matr: req.params.matr.toUpperCase() });
    if (!voiture) {
      return res.status(404).json({ message: 'Voiture not found' });
    }
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete voiture by ID
exports.deleteVoiture = async (req, res) => {
  try {
    const voiture = await Voiture.findByIdAndDelete(req.params.id);
    if (!voiture) {
      return res.status(404).json({ message: 'Voiture not found' });
    }
    res.status(200).json({ message: 'Voiture deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update voiture
exports.updateVoiture = async (req, res) => {
  try {
    const voiture = await Voiture.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!voiture) {
      return res.status(404).json({ message: 'Voiture not found' });
    }
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Echo utility to debug incoming body
exports.echo = async (req, res) => {
  res.status(200).json({ received: req.body });
};

// Delete voiture by matricule
exports.deleteVoitureByMatr = async (req, res) => {
  try {
    const v = await Voiture.findByIdAndDelete(req.params.matr);
    if (!v) return res.status(404).json({ message: 'Voiture not found' });
    res.status(200).json({ message: 'Voiture deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search voitures with query params
exports.searchVoitures = async (req, res) => {
  try {
    const q = {};
    if (req.query.marque) q.marque = new RegExp(String(req.query.marque), 'i');
    if (req.query.modele) q.modele = new RegExp(String(req.query.modele), 'i');
    if (req.query.carburant) q.carburant = String(req.query.carburant);
    if (req.query.etat) q.etat = String(req.query.etat);
    if (req.query.minAnnee || req.query.maxAnnee) {
      q.annee = {};
      if (req.query.minAnnee) q.annee.$gte = Number(req.query.minAnnee);
      if (req.query.maxAnnee) q.annee.$lte = Number(req.query.maxAnnee);
    }
    if (req.query.minKm || req.query.maxKm) {
      q.kilometrage = {};
      if (req.query.minKm) q.kilometrage.$gte = Number(req.query.minKm);
      if (req.query.maxKm) q.kilometrage.$lte = Number(req.query.maxKm);
    }
    if (req.query.minTarif || req.query.maxTarif) {
      q.tarifJournalier = {};
      if (req.query.minTarif) q.tarifJournalier.$gte = Number(req.query.minTarif);
      if (req.query.maxTarif) q.tarifJournalier.$lte = Number(req.query.maxTarif);
    }
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q), 'i');
      q.$or = [{ marque: rx }, { modele: rx }, { _id: rx }];
    }
    const data = await Voiture.find(q);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sort voitures by one or multiple fields
exports.sortVoitures = async (req, res) => {
  try {
    let sort = {};
    if (req.query.sort) {
      String(req.query.sort)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(part => {
          const [field, dir] = part.split(':');
          sort[field] = (String(dir || 'asc').toLowerCase() === 'desc') ? -1 : 1;
        });
    } else if (req.query.sortBy) {
      const field = String(req.query.sortBy);
      const dir = String(req.query.order || 'asc');
      sort[field] = (dir.toLowerCase() === 'desc') ? -1 : 1;
    } else {
      sort = { createdAt: -1 };
    }
    const data = await Voiture.find({}).sort(sort);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Statistics for voitures
exports.statsVoitures = async (req, res) => {
  try {
    const pipeline = [
      {
        $facet: {
          countByCarburant: [
            { $group: { _id: '$carburant', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          countByEtat: [
            { $group: { _id: '$etat', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          pricing: [
            { $group: { _id: null, avgTarif: { $avg: '$tarifJournalier' }, minTarif: { $min: '$tarifJournalier' }, maxTarif: { $max: '$tarifJournalier' } } },
          ],
          yearStats: [
            { $group: { _id: null, minAnnee: { $min: '$annee' }, maxAnnee: { $max: '$annee' } } },
          ],
          totals: [
            { $group: { _id: null, total: { $sum: 1 } } }
          ]
        }
      }
    ];
    const agg = await Voiture.aggregate(pipeline);
    const resObj = (agg && agg[0]) || {};
    res.status(200).json(resObj);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

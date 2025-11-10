const Voiture = require('../model/voiture'); 

async function addVoiture(req,res) {
  try{
        console.log('addVoiture received body:', req.body);
        
        const voiture = new Voiture(req.body);
        await voiture.save();
        res.status(201).json(voiture);
  }catch (err){
        console.log(err);
        if (err && err.code === 11000) {
          // duplicate key error on unique index (likely _id)
          return res.status(409).json({ message: 'Car already exists', keyValue: err.keyValue });
        }
        if (err && err.name === 'ValidationError') {
          return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        res.status(500).json({ message: 'Server error' });
  }
}

async function getVoitures(req,res){
  try { 
    const voitures = await Voiture.find();
    res.status(200).json(voitures);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getVoitureById(req,res) {
  try {
    const voiture = await Voiture.findById(req.params.id);
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getVoitureByMatricule(req, res) {
  try {
    const voiture = await Voiture.findById(req.params.matr);
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteVoiture(req, res) {
  try {
    await Voiture.findByIdAndDelete(req.params.id);
    res.status(200).send("voiture deleted");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  } 
}

async function updateVoiture (req, res)   {
  try {
    const voiture = await Voiture.findByIdAndUpdate(req.params.id, req.body, {
      new: true,            // renvoie le doc mis à jour
      runValidators: true,  // applique les validations du schéma
    });
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// echo utility to debug incoming body
async function echo(req, res) {
  res.status(200).json({ received: req.body });
}

async function deleteVoitureByMatr(req, res) {
  try {
    const v = await Voiture.findByIdAndDelete(req.params.matr);
    if (!v) return res.status(404).json({ message: 'not found' });
    res.status(200).send('voiture deleted');
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// SEARCH voitures with query params (no schema change)
async function searchVoitures(req, res) {
  try {
    const q = {};
    // exact or partial filters
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
    // generic free-text on marque/modele/_id
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
}

// SORT voitures by one or multiple fields
async function sortVoitures(req, res) {
  try {
    // support: ?sort=field:asc,field2:desc OR sortBy=field&order=asc
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
}

// STATISTICS for voitures
async function statsVoitures(req, res) {
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
}

module.exports={
  addVoiture,
  getVoitures,
  getVoitureById,
  getVoitureByMatricule,
  deleteVoiture,
  updateVoiture,
  deleteVoitureByMatr,
  echo,
  searchVoitures,
  sortVoitures,
  statsVoitures,
}
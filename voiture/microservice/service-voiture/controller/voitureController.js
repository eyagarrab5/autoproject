const Voiture = require('../model/voiture'); 

async function addVoiture(req, res) {
  console.log('\n=== DÉBUT DE LA FONCTION addVoiture ===');
  console.log('=== NOUVELLE DEMANDE DE CRÉATION DE VOITURE ===');
  console.log('Méthode HTTP:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Corps de la requête reçu:', JSON.stringify(req.body, null, 2));
  
  // Vérifier si le corps de la requête est vide
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('ERREUR: Le corps de la requête est vide');
    return res.status(400).json({ 
      success: false, 
      message: 'Le corps de la requête est vide' 
    });
  }
  
  try {
    // Vérification des champs obligatoires
    const requiredFields = ['_id', 'marque', 'modele', 'carburant'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.error('Champs manquants ou vides:', missingFields);
      return res.status(400).json({ 
        success: false,
        message: 'Champs manquants ou invalides', 
        missingFields,
        receivedData: req.body
      });
    }
    
    // Nettoyage et validation des données
    const voitureData = {
      _id: String(req.body._id).trim(),
      matr: String(req.body._id).trim(),
      marque: String(req.body.marque).trim(),
      modele: String(req.body.modele).trim(),
      carburant: String(req.body.carburant).trim(),
      annee: req.body.annee ? parseInt(req.body.annee) : null,
      kilometrage: req.body.kilometrage ? parseInt(req.body.kilometrage) : 0,
      etat: req.body.etat || 'available',
      tarifJournalier: req.body.tarifJournalier ? parseFloat(req.body.tarifJournalier) : 0,
      createdAt: new Date()
    };

    console.log('Données nettoyées:', JSON.stringify(voitureData, null, 2));
    
    // Vérification de l'existence de la voiture
    const existingVoiture = await Voiture.findOne({ _id: voitureData._id });
    if (existingVoiture) {
      console.error('Voiture existe déjà avec l\'ID:', voitureData._id);
      return res.status(409).json({ 
        success: false,
        message: 'Une voiture avec cette immatriculation existe déjà',
        existingId: voitureData._id
      });
    }
    
    console.log('Tentative de création de la voiture avec les données:', voitureData);
    
    // Création et sauvegarde de la voiture
    const voiture = new Voiture(voitureData);
    const savedVoiture = await voiture.save();
    
    console.log('Voiture enregistrée avec succès:', savedVoiture._id);
    
    // Retourner la réponse avec la voiture créée
    return res.status(201).json({
      success: true,
      message: 'Voiture créée avec succès',
      data: savedVoiture
    });
    
  } catch (err) {
    console.error('Erreur lors de la création de la voiture:', err);
    
    // Gestion des erreurs de validation
    if (err.name === 'ValidationError') {
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ 
        message: 'Erreur de validation', 
        errors 
      });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: 'Une voiture avec cette immatriculation existe déjà',
        keyValue: err.keyValue 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création de la voiture',
      error: err.message 
    });
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
          kmStats: [
            { $group: { _id: null, avgKm: { $avg: '$kilometrage' }, minKm: { $min: '$kilometrage' }, maxKm: { $max: '$kilometrage' } } },
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
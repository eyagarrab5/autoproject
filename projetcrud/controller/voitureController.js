const Voiture = require('../model/voiture'); 


async function addVoiture(req,res) {
  try{
        console.log('addVoiture received matr:', req.body && req.body.matr, 'full body:', req.body);
        // Map matr -> _id if provided (Option A: matr is the document _id)
        if (!req.body._id && req.body.matr) {
          req.body._id = req.body.matr;
        }
        // Remove stray matr key (not in schema anymore)
        if (req.body.matr) delete req.body.matr;
        const voiture = new Voiture(req.body);
        await voiture.save();
        res.status(201).json(voiture);
  }catch (err){
        console.log(err);
        if (err && err.code === 11000) {
          // duplicate key error on unique index (likely matr)
          return res.status(409).json({ message: 'matr already exists', keyValue: err.keyValue });
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

module.exports={
  addVoiture,
  getVoitures,
  getVoitureById,
  getVoitureByMatricule,
  deleteVoiture,
  updateVoiture,
  deleteVoitureByMatr,
  echo,
}
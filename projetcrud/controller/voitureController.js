const Voiture = require('../model/voiture'); 


async function addVoiture(req,res) {
  try{
        const voiture = new Voiture (req.body);
        await voiture.save();
        res.status(201).json(voiture);
  }catch (err){
        console.log(err);
  }
}

async function getVoitures(req,res){
  try { 
    const voitures = await Voiture.find();
    res.status(200).json(voitures);
  } catch (err) {
    console.log(err);
  }
}

async function getVoitureById(req,res) {
  try {
    const voiture = await Voiture.findById(req.params.id);
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
  }
}

async function getVoitureByMatricule(req, res) {
  try {
    const voiture = await Voiture.findOne({ matr: req.params.matr });
    res.status(200).json(voiture);
  } catch (err) {
    console.log(err);
  }
}

async function deleteVoiture(req, res) {
  try {
    await Voiture.findByIdAndDelete(req.params.id);
    res.status(200).send("voiture deleted");
  } catch (err) {
    console.log(err);
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
  }
}

module.exports={
  addVoiture,
  getVoitures,
  getVoitureById,
  getVoitureByMatricule,
  deleteVoiture,
  updateVoiture,
}
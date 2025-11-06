const Entretien = require('../model/entretien');
const Voiture = require('../model/voiture');

async function addEntretien(req, res) {
  try {
    // allow creation by voitureNumero if provided
    if (!req.body.car) {
      let v = null;
      if (req.body.matr != null) {
        v = await Voiture.findById(String(req.body.matr).trim().toUpperCase()).select('_id');
        if (!v) return res.status(400).json({ message: 'matr not found' });
        req.body.car = v._id;
      } else if (req.body.voitureNumero != null) {
        v = await Voiture.findById(String(req.body.voitureNumero).trim().toUpperCase()).select('_id');
        if (!v) return res.status(400).json({ message: 'voitureNumero not found' });
        req.body.car = v._id;
      }
    } else {
      req.body.car = String(req.body.car).trim().toUpperCase();
    }
    const entretien = new Entretien(req.body);
    await entretien.save();
    res.status(201).json(entretien);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function addEntretienByMatr(req, res) {
  try {
    const matr = String(req.params.matr || '').trim().toUpperCase();
    if (!matr) return res.status(400).json({ message: 'matr is required' });
    const v = await Voiture.findById(matr).select('_id');
    if (!v) return res.status(400).json({ message: 'matr not found' });
    req.body.car = v._id;
    const entretien = new Entretien(req.body);
    await entretien.save();
    res.status(201).json(entretien);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getEntretiens(req, res) {
  try {
    const entretiens = await Entretien.find().populate('car');
    res.status(200).json(entretiens);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getEntretienById(req, res) {
  try {
    const entretien = await Entretien.findById(req.params.id).populate('car');
    res.status(200).json(entretien);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateEntretien(req, res) {
  try {
    const entretien = await Entretien.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(entretien);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteEntretien(req, res) {
  try {
    await Entretien.findByIdAndDelete(req.params.id);
    res.status(200).send('entretien deleted');
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getEntretiensByCar(req, res) {
  try {
    const entretiens = await Entretien.find({ car: req.params.carId }).populate('car');
    res.status(200).json(entretiens);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  addEntretien,
  getEntretiens,
  getEntretienById,
  updateEntretien,
  deleteEntretien,
  getEntretiensByCar,
  addEntretienByMatr,
};

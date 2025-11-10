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

// SEARCH entretiens with query params
async function searchEntretiens(req, res) {
  try {
    const q = {};
    if (req.query.car) q.car = String(req.query.car).trim().toUpperCase();
    if (req.query.type) q.type = String(req.query.type);
    if (req.query.minCout || req.query.maxCout) {
      q.cout = {};
      if (req.query.minCout) q.cout.$gte = Number(req.query.minCout);
      if (req.query.maxCout) q.cout.$lte = Number(req.query.maxCout);
    }
    if (req.query.startDate || req.query.endDate) {
      q.date = {};
      if (req.query.startDate) q.date.$gte = String(req.query.startDate);
      if (req.query.endDate) q.date.$lte = String(req.query.endDate);
    }
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q), 'i');
      q.$or = [{ description: rx }, { type: rx }];
    }
    const data = await Entretien.find(q).populate('car');
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// SORT entretiens by fields
async function sortEntretiens(req, res) {
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
      sort = { date: -1 };
    }
    const data = await Entretien.find({}).populate('car').sort(sort);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// STATISTICS for entretiens
async function statsEntretiens(req, res) {
  try {
    const pipeline = [
      {
        $facet: {
          countByType: [
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          costSummary: [
            { $group: { _id: null, totalCout: { $sum: '$cout' }, avgCout: { $avg: '$cout' }, minCout: { $min: '$cout' }, maxCout: { $max: '$cout' } } },
          ],
          perCar: [
            { $group: { _id: '$car', count: { $sum: 1 }, totalCout: { $sum: '$cout' } } },
            { $sort: { totalCout: -1 } }
          ],
          totals: [
            { $group: { _id: null, total: { $sum: 1 } } }
          ]
        }
      }
    ];
    const agg = await Entretien.aggregate(pipeline);
    const resObj = (agg && agg[0]) || {};
    res.status(200).json(resObj);
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
  searchEntretiens,
  sortEntretiens,
  statsEntretiens,
};

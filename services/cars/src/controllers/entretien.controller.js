const Entretien = require('../models/entretien.model');
const Voiture = require('../models/voiture.model');

// Create a new entretien
exports.addEntretien = async (req, res) => {
  try {
    if (!req.body.car) {
      let v = null;
      if (req.body.matr != null) {
        v = await Voiture.findOne({ matr: String(req.body.matr).trim().toUpperCase() }).select('matr');
        if (!v) return res.status(400).json({ message: 'matr not found' });
        req.body.car = v.matr;
      } else if (req.body.voitureNumero != null) {
        v = await Voiture.findOne({ matr: String(req.body.voitureNumero).trim().toUpperCase() }).select('matr');
        if (!v) return res.status(400).json({ message: 'voitureNumero not found' });
        req.body.car = v.matr;
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
};

// Create entretien by matricule
exports.addEntretienByMatr = async (req, res) => {
  try {
    const matr = String(req.params.matr || '').trim().toUpperCase();
    if (!matr) return res.status(400).json({ message: 'matr is required' });
    const v = await Voiture.findOne({ matr: matr }).select('matr');
    if (!v) return res.status(400).json({ message: 'matr not found' });
    req.body.car = v.matr;
    const entretien = new Entretien(req.body);
    await entretien.save();
    res.status(201).json(entretien);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all entretiens
exports.getEntretiens = async (req, res) => {
  try {
    const entretiens = await Entretien.find();
    // Manually populate car info
    const result = await Promise.all(entretiens.map(async (e) => {
      const voiture = await Voiture.findOne({ matr: e.car });
      return { ...e.toObject(), voiture };
    }));
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get entretien by ID
exports.getEntretienById = async (req, res) => {
  try {
    const entretien = await Entretien.findById(req.params.id);
    if (!entretien) {
      return res.status(404).json({ message: 'Entretien not found' });
    }
    // Manually populate car info
    const voiture = await Voiture.findOne({ matr: entretien.car });
    res.status(200).json({ ...entretien.toObject(), voiture });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update entretien
exports.updateEntretien = async (req, res) => {
  try {
    const entretien = await Entretien.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!entretien) {
      return res.status(404).json({ message: 'Entretien not found' });
    }
    res.status(200).json(entretien);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete entretien
exports.deleteEntretien = async (req, res) => {
  try {
    const entretien = await Entretien.findByIdAndDelete(req.params.id);
    if (!entretien) {
      return res.status(404).json({ message: 'Entretien not found' });
    }
    res.status(200).json({ message: 'Entretien deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get entretiens by car (by matricule)
exports.getEntretiensByCar = async (req, res) => {
  try {
    const carMatr = req.params.carId;
    const entretiens = await Entretien.find({ car: carMatr });
    // Manually populate car info
    const voiture = await Voiture.findOne({ matr: carMatr });
    const result = entretiens.map(e => ({ ...e.toObject(), voiture }));
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search entretiens with query params
exports.searchEntretiens = async (req, res) => {
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
    const entretiens = await Entretien.find(q);
    // Manually populate car info
    const result = await Promise.all(entretiens.map(async (e) => {
      const voiture = await Voiture.findOne({ matr: e.car });
      return { ...e.toObject(), voiture };
    }));
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sort entretiens by fields
exports.sortEntretiens = async (req, res) => {
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
    const entretiens = await Entretien.find({}).sort(sort);
    // Manually populate car info
    const result = await Promise.all(entretiens.map(async (e) => {
      const voiture = await Voiture.findOne({ matr: e.car });
      return { ...e.toObject(), voiture };
    }));
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Statistics for entretiens
exports.statsEntretiens = async (req, res) => {
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
};

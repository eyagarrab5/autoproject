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

// PREDICTIVE MAINTENANCE (heuristic-based)
async function predictMaintenance(req, res) {
  try {
    const [voitures, entretiens] = await Promise.all([
      Voiture.find({}),
      Entretien.find({})
    ]);

    const today = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);
    const daysBetween = (a, b) => Math.round((a.getTime() - b.getTime()) / DAY_MS);
    const safeDate = (s) => {
      const d = new Date(s);
      return isNaN(d.getTime()) ? today : d;
    };

    // Build maps
    const entretiensByCar = new Map();
    const modelRepairCount = new Map(); // key: marque|modele
    const modelVehicleCount = new Map();

    voitures.forEach(v => {
      const key = `${v.marque||''}|${v.modele||''}`;
      modelVehicleCount.set(key, (modelVehicleCount.get(key) || 0) + 1);
    });

    entretiens.forEach(e => {
      const arr = entretiensByCar.get(e.car) || [];
      arr.push(e);
      entretiensByCar.set(e.car, arr);
      if (e.type === 'reparation') {
        const v = voitures.find(x => String(x._id) === String(e.car));
        if (v) {
          const key = `${v.marque||''}|${v.modele||''}`;
          modelRepairCount.set(key, (modelRepairCount.get(key) || 0) + 1);
        }
      }
    });

    // Average costs by type (fallbacks if no history)
    const costAgg = entretiens.reduce((acc, e) => {
      acc[e.type] = acc[e.type] || { sum: 0, n: 0 };
      acc[e.type].sum += (e.cout || 0);
      acc[e.type].n += 1;
      return acc;
    }, {});
    const avgCost = (type, defVal) => {
      const c = costAgg[type];
      if (!c || c.n === 0) return defVal;
      return c.sum / c.n;
    };
    const avgRoutine = avgCost('routine', 120.0);
    const avgInspection = avgCost('inspection', 200.0);
    const avgReparation = avgCost('reparation', 350.0);

    // Risk by model (normalized 0..1 heuristic)
    const modelRisk = new Map();
    modelVehicleCount.forEach((vehCount, key) => {
      const repairs = modelRepairCount.get(key) || 0;
      // Simple rate per vehicle; squashed to [0,1)
      const rate = vehCount > 0 ? repairs / vehCount : 0;
      const score = Math.min(1, rate / 5); // if 5 repairs/veh ~ 1.0
      modelRisk.set(key, score);
    });

    // Thresholds
    const KM_ROUTINE = 15000;
    const KM_MAJOR = 30000; // for info only
    const DAYS_ROUTINE = 180; // ~6 months
    const DAYS_MAJOR = 365; // ~1 year

    const perVehicle = [];

    for (const v of voitures) {
      const carId = String(v._id);
      const carEnts = (entretiensByCar.get(carId) || []).slice().sort((a, b) => safeDate(b.date) - safeDate(a.date));
      const lastMaint = carEnts[0];
      const baseDate = lastMaint ? safeDate(lastMaint.date) : safeDate(v.createdAt);

      const km = Number(v.kilometrage || 0);
      const createdAt = safeDate(v.createdAt);
      const daysInService = Math.max(1, daysBetween(today, createdAt));
      const avgKmPerDay = km / daysInService;

      // Next km-based thresholds
      const nextRoutineKm = Math.ceil(km / KM_ROUTINE) * KM_ROUTINE || KM_ROUTINE;
      const kmToRoutine = Math.max(0, nextRoutineKm - km);
      const daysToRoutineByKm = avgKmPerDay > 0 ? kmToRoutine / avgKmPerDay : Number.POSITIVE_INFINITY;

      // Next time-based thresholds
      const nextRoutineDate = addDays(baseDate, DAYS_ROUTINE);
      const nextMajorDate = addDays(baseDate, DAYS_MAJOR);
      const daysToRoutineByDate = Math.max(0, daysBetween(nextRoutineDate, today));
      const daysToMajorByDate = Math.max(0, daysBetween(nextMajorDate, today));

      // Urgency = soonest of km or date routine thresholds
      const urgenceDays = Math.min(daysToRoutineByKm, daysToRoutineByDate);

      // Risk scoring
      const key = `${v.marque||''}|${v.modele||''}`;
      let risk = modelRisk.get(key) || 0;
      // Age impact
      const year = Number(v.annee || 0);
      const age = year > 0 ? (today.getFullYear() - year) : 0;
      if (age >= 10) risk += 0.25; else if (age >= 5) risk += 0.1;
      // Fuel impact
      if (v.carburant === 'diesel') risk += 0.05;
      if (v.carburant === 'hybride') risk -= 0.03;
      if (v.carburant === 'electrique') risk -= 0.05;
      // High mileage impact
      if (km >= 150000) risk += 0.2; else if (km >= 100000) risk += 0.1;
      risk = Math.max(0, Math.min(1, risk));

      // Choose upcoming maintenance type/cost heuristic
      const upcomingByDateIsMajor = daysToMajorByDate < daysToRoutineByDate && daysToMajorByDate <= daysToRoutineByKm;
      const upcomingType = upcomingByDateIsMajor ? 'major' : 'routine';
      const estCost = upcomingType === 'major' ? Math.max(avgInspection, avgReparation) : avgRoutine;

      perVehicle.push({
        id: carId,
        marque: v.marque,
        modele: v.modele,
        carburant: v.carburant,
        annee: v.annee,
        kilometrage: km,
        prochaine_revision_km: nextRoutineKm,
        km_restant: kmToRoutine,
        prochaine_revision_date: nextRoutineDate.toISOString().slice(0,10),
        urgence_maintenance_jours: Number.isFinite(urgenceDays) ? Math.round(urgenceDays) : null,
        risque_panne_imminente: Number(risk.toFixed(2)),
        type_prevu: upcomingType,
        cout_estime: Number(estCost.toFixed(2)),
        derniere_maintenance: lastMaint ? safeDate(lastMaint.date).toISOString().slice(0,10) : null,
      });
    }

    // Outputs
    const within15Days = perVehicle
      .filter(v => v.urgence_maintenance_jours != null && v.urgence_maintenance_jours <= 15)
      .sort((a,b) => a.urgence_maintenance_jours - b.urgence_maintenance_jours);

    const alerts = perVehicle
      .filter(v => v.risque_panne_imminente >= 0.7)
      .sort((a,b) => b.risque_panne_imminente - a.risque_panne_imminente);

    const planning = perVehicle
      .map(v => ({
        id: v.id,
        marque: v.marque,
        modele: v.modele,
        date_proposee: v.urgence_maintenance_jours != null ? new Date(Date.now() + v.urgence_maintenance_jours*DAY_MS).toISOString().slice(0,10) : null,
        urgence_jours: v.urgence_maintenance_jours,
        type_prevu: v.type_prevu,
      }))
      .sort((a,b) => (a.urgence_jours ?? Number.MAX_SAFE_INTEGER) - (b.urgence_jours ?? Number.MAX_SAFE_INTEGER));

    const totalCostNext30 = perVehicle
      .filter(v => v.urgence_maintenance_jours != null && v.urgence_maintenance_jours <= 30)
      .reduce((s, v) => s + (v.cout_estime || 0), 0);

    res.status(200).json({
      resume: {
        vehicules_total: voitures.length,
        entretiens_total: entretiens.length,
        a_venir_15_jours: within15Days.length,
        cout_estime_30_jours: Number(totalCostNext30.toFixed(2)),
      },
      vehicules_a_maintenir_15j: within15Days,
      alertes_prioritaires: alerts,
      planning_previsionnel: planning,
      estimation_par_vehicule: perVehicle,
    });
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
    
    // Filtre par ID de voiture (exact match)
    if (req.query.car && req.query.car.trim() !== '') {
      q.car = String(req.query.car).trim().toUpperCase();
    }
    
    // Filtre par matricule de voiture (si vous voulez filtrer par immatriculation)
    // Note: Cela nécessiterait une jointure ou une recherche différente
    
    // Filtre par type (avec validation optionnelle)
    if (req.query.type && req.query.type.trim() !== '') {
      const typeVal = String(req.query.type).trim();
      // Optionnel: valider contre les types autorisés
      const allowedTypes = ['routine', 'reparation', 'inspection', 'autre'];
      if (allowedTypes.includes(typeVal)) {
        q.type = typeVal;
      }
    }
    
    // Filtre par coût
    if (req.query.minCout || req.query.maxCout) {
      q.cout = {};
      if (req.query.minCout && !isNaN(req.query.minCout)) {
        q.cout.$gte = Number(req.query.minCout);
      }
      if (req.query.maxCout && !isNaN(req.query.maxCout)) {
        q.cout.$lte = Number(req.query.maxCout);
      }
    }
    
    // Filtre par date
    if (req.query.startDate || req.query.endDate) {
      q.date = {};
      if (req.query.startDate && req.query.startDate.trim() !== '') {
        q.date.$gte = String(req.query.startDate).trim();
      }
      if (req.query.endDate && req.query.endDate.trim() !== '') {
        q.date.$lte = String(req.query.endDate).trim();
      }
    }
    
    // Filtre par texte (recherche dans description OU type)
    if (req.query.q && req.query.q.trim() !== '') {
      const rx = new RegExp(String(req.query.q).trim(), 'i');
      // Utilisation de $and pour combiner avec d'autres filtres
      q.$and = q.$and || [];
      q.$and.push({
        $or: [
          { description: rx },
          { type: rx }
        ]
      });
    }
    
    console.log('Search query:', q); // Pour le débogage
    
    const data = await Entretien.find(q).populate('car');
    res.status(200).json(data);
  } catch (err) {
    console.log('Search error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
  predictMaintenance,
};

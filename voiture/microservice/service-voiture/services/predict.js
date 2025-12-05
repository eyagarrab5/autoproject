const Voiture = require('../model/voiture');
const Entretien = require('../model/entretien');

function safeDate(s, fallback = new Date()) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d;
}

async function computePredictions() {
  const [voitures, entretiens] = await Promise.all([
    Voiture.find({}),
    Entretien.find({})
  ]);

  const today = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);
  const daysBetween = (a, b) => Math.round((a.getTime() - b.getTime()) / DAY_MS);

  const entretiensByCar = new Map();
  const modelRepairCount = new Map();
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

  const modelRisk = new Map();
  modelVehicleCount.forEach((vehCount, key) => {
    const repairs = modelRepairCount.get(key) || 0;
    const rate = vehCount > 0 ? repairs / vehCount : 0;
    const score = Math.min(1, rate / 5);
    modelRisk.set(key, score);
  });

  const KM_ROUTINE = 15000;
  const DAYS_ROUTINE = 180;
  const DAYS_MAJOR = 365;

  const perVehicle = [];

  for (const v of voitures) {
    const carId = String(v._id);
    const carEnts = (entretiensByCar.get(carId) || []).slice().sort((a, b) => safeDate(b.date, today) - safeDate(a.date, today));
    const lastMaint = carEnts[0];
    const baseDate = lastMaint ? safeDate(lastMaint.date, today) : safeDate(v.createdAt, today);

    const km = Number(v.kilometrage || 0);
    const createdAt = safeDate(v.createdAt, today);
    const daysInService = Math.max(1, daysBetween(today, createdAt));
    const avgKmPerDay = km / daysInService;

    const nextRoutineKm = Math.ceil(km / KM_ROUTINE) * KM_ROUTINE || KM_ROUTINE;
    const kmToRoutine = Math.max(0, nextRoutineKm - km);
    const daysToRoutineByKm = avgKmPerDay > 0 ? kmToRoutine / avgKmPerDay : Number.POSITIVE_INFINITY;

    const nextRoutineDate = addDays(baseDate, DAYS_ROUTINE);
    const nextMajorDate = addDays(baseDate, DAYS_MAJOR);
    const daysToRoutineByDate = Math.max(0, daysBetween(nextRoutineDate, today));
    const daysToMajorByDate = Math.max(0, daysBetween(nextMajorDate, today));

    const urgenceDays = Math.min(daysToRoutineByKm, daysToRoutineByDate);

    const key = `${v.marque||''}|${v.modele||''}`;
    let risk = modelRisk.get(key) || 0;
    const year = Number(v.annee || 0);
    const age = year > 0 ? (today.getFullYear() - year) : 0;
    if (age >= 10) risk += 0.25; else if (age >= 5) risk += 0.1;
    if (v.carburant === 'diesel') risk += 0.05;
    if (v.carburant === 'hybride') risk -= 0.03;
    if (v.carburant === 'electrique') risk -= 0.05;
    if (km >= 150000) risk += 0.2; else if (km >= 100000) risk += 0.1;
    risk = Math.max(0, Math.min(1, risk));

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
      derniere_maintenance: lastMaint ? safeDate(lastMaint.date, today).toISOString().slice(0,10) : null,
    });
  }

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

  return {
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
  };
}

module.exports = { computePredictions };

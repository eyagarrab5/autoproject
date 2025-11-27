const yup = require('yup');

const voitureCreateSchema = yup.object({
  matr: yup.string().min(1).max(50).required(),
  marque: yup.string().min(1).max(50).matches(/^[a-zA-Z0-9\s\-]+$/).required(),
  modele: yup.string().min(1).max(50).required(),
  annee: yup.number().integer().min(1900).max(2025).nullable().optional(),
  carburant: yup.string().oneOf(['essence','diesel','hybride','electrique'], 'Le carburant est invalide. Valeurs autorisées: essence, diesel, hybride, electrique').required(),
  kilometrage: yup.number().min(0).max(1000000).optional(),
  etat: yup.string().oneOf(['available','rented','maintenance','unavailable']).optional(),
  tarifJournalier: yup.number().min(0).max(10000).optional(),
  createdAt: yup.string().test('not-future', 'createdAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional(),
  updatedAt: yup.string().test('not-future', 'updatedAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional()
});

const voitureUpdateSchema = yup.object({
  marque: yup.string().min(1).max(50).matches(/^[a-zA-Z0-9\s\-]+$/).optional(),
  modele: yup.string().min(1).max(50).optional(),
  annee: yup.number().integer().min(1900).max(2025).optional(),
  carburant: yup.string().oneOf(['essence','diesel','hybride','electrique'], 'Le carburant est invalide. Valeurs autorisées: essence, diesel, hybride, electrique').optional(),
  kilometrage: yup.number().min(0).max(1000000).optional(),
  etat: yup.string().oneOf(['available','rented','maintenance','unavailable']).optional(),
  tarifJournalier: yup.number().min(0).max(10000).optional(),
  createdAt: yup.string().test('not-future', 'createdAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional(),
  updatedAt: yup.string().test('not-future', 'updatedAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional()
}).noUnknown(false);

const entretienCreateSchema = yup.object({
  matr: yup.string().min(1).max(100).optional(),
  car: yup.string().min(1).max(100).optional(),
  voitureNumero: yup.string().min(1).max(100).optional(),
  type: yup.string().oneOf(['routine','reparation','inspection','autre']).required(),
  date: yup.string().required().test('lte-2025','date invalid', v=>{ if(!v) return false; const d=new Date(v); if(isNaN(d)) return false; const max=new Date('2025-12-31'); return d<=max && d.getFullYear()<=2025 }),
  description: yup.string().max(1000).optional(),
  cout: yup.number().min(0).max(1000000).required(),
  piecesReconditionneesPct: yup.number().integer().min(0).max(100).optional(),
  dechetsKg: yup.number().min(0).max(1000).optional(),
  createdAt: yup.string().test('not-future', 'createdAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional(),
  updatedAt: yup.string().test('not-future', 'updatedAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional()
}).test('matr-or-car','matr or car required', value=>{ if(!value) return false; return !!(value.matr||value.car||value.voitureNumero) });

const entretienUpdateSchema = yup.object({
  type: yup.string().oneOf(['routine','reparation','inspection','autre']).optional(),
  date: yup.string().test('lte-2025','date invalid', v=>{ if(!v) return true; const d=new Date(v); if(isNaN(d)) return false; const max=new Date('2025-12-31'); return d<=max && d.getFullYear()<=2025 }).optional(),
  description: yup.string().max(1000).optional(),
  cout: yup.number().min(0).max(1000000).optional(),
  piecesReconditionneesPct: yup.number().integer().min(0).max(100).optional(),
  dechetsKg: yup.number().min(0).max(1000).optional(),
  createdAt: yup.string().test('not-future', 'createdAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional(),
  updatedAt: yup.string().test('not-future', 'updatedAt invalid', v=>!v||(!isNaN(Date.parse(v))&& new Date(v)<=new Date() )).optional()
}).noUnknown(false);

function mw(schema) {
  return async (req, res, next) => {
    try {
      await schema.validate(req.body, { abortEarly: false, stripUnknown: false });
      next();
    } catch (err) {
      if (err && err.name === 'ValidationError') {
        const inner = Array.isArray(err.inner) && err.inner.length ? err.inner : [err];
        const details = inner.map(e => ({ path: e.path, message: e.message }));
        return res.status(400).json({ message: 'Validation errors', errors: details });
      }
      res.status(400).json({ message: 'Validation error', errors: err.message });
    }
  };
}

const validateVoitureCreate = mw(voitureCreateSchema);
const validateVoitureUpdate = mw(voitureUpdateSchema);
const validateEntretienCreate = mw(entretienCreateSchema);
const validateEntretienUpdate = mw(entretienUpdateSchema);

module.exports = {
  validateVoitureCreate,
  validateVoitureUpdate,
  validateEntretienCreate,
  validateEntretienUpdate
};

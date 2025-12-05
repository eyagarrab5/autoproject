const express = require('express');
const router = express.Router();
const entretienController = require('../controller/entretienController');
const { validateEntretienCreate, validateEntretienUpdate } = require('../middl/validate');

// create
router.post('/', validateEntretienCreate, entretienController.addEntretien);
// create by matricule (path param)
router.post('/voiture/:matr', entretienController.addEntretienByMatr);
// search, sort, statistics (non-breaking)
router.get('/search', entretienController.searchEntretiens);
router.get('/sort', entretienController.sortEntretiens);
router.get('/stats', entretienController.statsEntretiens);
// predictive maintenance
router.get('/predict', entretienController.predictMaintenance);
// list all
router.get('/', entretienController.getEntretiens);
// list by car
router.get('/car/:carId', entretienController.getEntretiensByCar);
// get one
router.get('/:id', entretienController.getEntretienById);
// update
router.put('/:id', validateEntretienUpdate, entretienController.updateEntretien);
// delete
router.delete('/:id', entretienController.deleteEntretien);

module.exports = router;

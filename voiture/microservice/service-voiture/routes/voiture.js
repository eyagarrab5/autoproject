const express = require('express');
const router = express.Router();
const voitureController = require('../controller/voitureController');
const { validateVoitureCreate, validateVoitureUpdate } = require('../middl/validate');

// create
router.post('/', voitureController.addVoiture);  // Sans validation pour le moment
// debug echo body
router.post('/echo', voitureController.echo);
// search, sort, statistics (non-breaking)
router.get('/search', voitureController.searchVoitures);
router.get('/sort', voitureController.sortVoitures);
router.get('/stats', voitureController.statsVoitures);
// list
router.get('/', voitureController.getVoitures);
// get by plate number (matr) - place before :id to avoid conflict
router.get('/plate/:matr', voitureController.getVoitureByMatricule);
// delete by plate
router.delete('/plate/:matr', voitureController.deleteVoitureByMatr);
// get by id
router.get('/:id', voitureController.getVoitureById);
// update
router.put('/:id', validateVoitureUpdate, voitureController.updateVoiture);
// delete
router.delete('/:id', voitureController.deleteVoiture);

module.exports = router;

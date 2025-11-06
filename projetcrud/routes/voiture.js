const express = require('express');
const router = express.Router();
const voitureController = require('../controller/voitureController');

// create
router.post('/', voitureController.addVoiture);
// debug echo body
router.post('/echo', voitureController.echo);
// list
router.get('/', voitureController.getVoitures);
// get by plate number (matr) - place before :id to avoid conflict
router.get('/plate/:matr', voitureController.getVoitureByMatricule);
// delete by plate
router.delete('/plate/:matr', voitureController.deleteVoitureByMatr);
// get by id
router.get('/:id', voitureController.getVoitureById);
// update
router.put('/:id', voitureController.updateVoiture);
// delete
router.delete('/:id', voitureController.deleteVoiture);

module.exports = router;

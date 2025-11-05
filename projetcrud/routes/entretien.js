const express = require('express');
const router = express.Router();
const entretienController = require('../controller/entretienController');

// create
router.post('/', entretienController.addEntretien);
// list all
router.get('/', entretienController.getEntretiens);
// list by car
router.get('/car/:carId', entretienController.getEntretiensByCar);
// get one
router.get('/:id', entretienController.getEntretienById);
// update
router.put('/:id', entretienController.updateEntretien);
// delete
router.delete('/:id', entretienController.deleteEntretien);

module.exports = router;

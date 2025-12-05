const express = require('express');
const router = express.Router();
const ctrl = require('../controller/notificationsController');

router.get('/preview', ctrl.preview);
router.post('/run', ctrl.run);

module.exports = router;

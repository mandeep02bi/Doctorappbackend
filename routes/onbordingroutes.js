const express = require('express');
const router = express.Router();
const controller = require('../controllers/onbordingcontroller');

router.get('/onboard', controller.getall);
router.get('/onboard/:id' , controller.getbyid);
router.post('/onboard' , controller.create);
router.put('/onboard/:id',controller.update);
router.delete('/onboard/:id', controller.delete);

module.exports = router;
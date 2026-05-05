const express = require('express');
const router = express.Router();
const controller = require('../controllers/onbordingcontroller');
const upload = require("../middlwere/upload");
router.get('/onboard', controller.getall);
router.get('/onboard/:id' , controller.getbyid);
router.post('/onboard' , upload.single('image'), controller.create);
router.put('/onboard/:id', upload.single('image'), controller.update);
router.delete('/onboard/:id', controller.delete);

module.exports = router;
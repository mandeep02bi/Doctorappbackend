const express = require('express');
const router = express.Router();
const controller = require('../controllers/remindercontroller');

router.post('/reminder' , controller.create);
router.get('/reminder/receiver/:receiver_id', controller.getbyreceiver);
router.get('/reminder/sender/:sender_id', controller.getbysender);

module.exports = router;
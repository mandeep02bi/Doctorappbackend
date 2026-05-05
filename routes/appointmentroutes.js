const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentcontroller');

router.post('/appointment' , controller.create);
router.get('/appointment/receiver/:receiver_id', controller.getbyreceiver);
router.get('/appointment/sender/:sender_id', controller.getbysender);
router.put('/appointment/status/:id', controller.updatestatus);
router.put('/appointment/datetime/:id', controller.updatedatetime);
router.delete('/appointment/:id', controller.delete);

module.exports = router;
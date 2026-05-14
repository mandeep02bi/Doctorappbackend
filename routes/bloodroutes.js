const express = require('express');
const router = express.Router();
const controller = require('../controllers/bloodcontroller');
const { verifytoken } = require('../middlwere/authmiddleware');


const {allowrole} = require('../middlwere/rolemiddleware');

router.post('/blood',
    verifytoken,
    allowrole('admin'),
    controller.postblood
);

router.get('/blood', controller.getblood);

module.exports = router;
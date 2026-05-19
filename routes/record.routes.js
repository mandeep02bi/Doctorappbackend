const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { getRecords } = require('../controllers/record.controller');

router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getRecords);

module.exports = router;

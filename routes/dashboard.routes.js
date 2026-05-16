const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { getDashboard } = require('../controllers/dashboard.controller');

router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getDashboard);

module.exports = router;

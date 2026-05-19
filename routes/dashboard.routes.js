const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getDashboard } = require('../controllers/dashboard.controller');

router.get('/', auth, getDashboard);

module.exports = router;

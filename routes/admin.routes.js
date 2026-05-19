const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { adminDashboard, getAllUsers, resetPdfLimit } = require('../controllers/admin.controller');

router.get('/dashboard', auth, role('Admin'), adminDashboard);
router.get('/users', auth, role('Admin'), getAllUsers);
router.patch('/reset-limit/:user_code', auth, role('Admin'), resetPdfLimit);

module.exports = router;

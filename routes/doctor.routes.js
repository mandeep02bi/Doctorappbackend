const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const {
    getAllDoctors,
    getMyProfile,
    createProfile,
    updateProfile,
} = require('../controllers/doctor.controller');

// List all doctors (Staff needs this for appointment booking dropdown)
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllDoctors);

// Doctor's own extended profile
router.get('/profile', auth, role('Admin', 'Doctor'), getMyProfile);
router.post('/profile', auth, role('Admin', 'Doctor'), createProfile);
router.put('/profile', auth, role('Admin', 'Doctor'), updateProfile);

module.exports = router;
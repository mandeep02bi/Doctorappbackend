const router = require('express').Router();
const {
    createProfile,
    getMyProfile,
    updateProfile,
    deleteProfile
} = require('../controllers/patientController');

const { protect } = require('../middleware/authMiddleware');

router.post('/profile', protect, createProfile);
router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteProfile);

module.exports = router;
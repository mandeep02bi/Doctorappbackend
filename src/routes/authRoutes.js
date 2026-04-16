const router = require('express').Router();
const { signup, verifyOTP, login, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
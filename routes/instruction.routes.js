const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const ownership = require('../middlewares/ownership');
const pdfLimiter = require('../middlewares/pdfLimiter');
const { createInstruction, getAllInstructions, getInstruction, updateInstruction, deleteInstruction } = require('../controllers/instruction.controller');

router.post('/', auth, role('Admin', 'Doctor'), pdfLimiter, createInstruction);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllInstructions);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getInstruction);
router.put('/:id', auth, role('Admin', 'Doctor'), ownership('instructions', 'doctor_id'), updateInstruction);
router.delete('/:id', auth, role('Admin', 'Doctor'), ownership('instructions', 'doctor_id'), deleteInstruction);

module.exports = router;

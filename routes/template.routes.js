const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const ownership = require('../middlewares/ownership');
const { createTemplate, getAllTemplates, getTemplate, searchTemplates, updateTemplate, deleteTemplate } = require('../controllers/template.controller');

router.post('/', auth, role('Admin', 'Doctor'), createTemplate);
router.get('/', auth, role('Admin', 'Doctor'), getAllTemplates);
router.get('/search', auth, role('Admin', 'Doctor'), searchTemplates);
router.get('/:id', auth, role('Admin', 'Doctor'), getTemplate);
router.put('/:id', auth, role('Admin', 'Doctor'), ownership('templates', 'created_by'), updateTemplate);
router.delete('/:id', auth, role('Admin', 'Doctor'), ownership('templates', 'created_by'), deleteTemplate);

module.exports = router;

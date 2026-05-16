const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const upload = require('../middlewares/upload');
const {
    createRecord,
    getRecordById,
    deleteRecord,
    uploadSingle,
    uploadMultiple,
    getAllRecords,
} = require('../controllers/record.controller');

router.post('/', auth, role('Admin', 'Doctor', 'Staff'), upload.single('file'), createRecord);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllRecords);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getRecordById);
router.delete('/:id', auth, role('Admin', 'Staff'), deleteRecord);


// Upload endpoints
router.post('/upload/single', auth, role('Admin', 'Doctor', 'Staff'), upload.single('file'), uploadSingle);
router.post('/upload/multiple', auth, role('Admin', 'Doctor', 'Staff'), upload.array('files', 10), uploadMultiple);

module.exports = router;

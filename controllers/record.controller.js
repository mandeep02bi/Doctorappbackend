const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

const VALID_FILE_TYPES = [
    'Prescription', 'Lab Report', 'X-Ray', 'MRI', 'CT Scan',
    'Invoice', 'Certificate', 'Insurance Document', 'Consent Form', 'General Medical Record',
];


// POST /api/records
const createRecord = asyncHandler(async (req, res) => {
    const { patient_id, file_type, title, notes } = req.body;
    const DOCTOR_ONLY_TYPES = ['Prescription', 'Certificate'];

if (req.user.role === 'Staff' && DOCTOR_ONLY_TYPES.includes(file_type)) {
    return error(res, 403, 'Staff cannot upload this record type');
}

    if (!req.file) {
        return error(res, 400, 'File is required');
    }

    if (!VALID_FILE_TYPES.includes(file_type)) {
        return error(res, 400, 'Invalid file type');
    }

    // Verify patient exists
    const [patient] = await pool.query('SELECT id FROM patients WHERE id = ? AND isDeleted = false', [patient_id]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    const file_url = `/uploads/${req.file.filename}`;
    const file_name = req.file.originalname;
    const file_size = Math.round(req.file.size / 1024); // KB

    const [result] = await pool.query(
        `INSERT INTO records (patient_id, uploaded_by, file_url, file_name, file_size, file_type, title, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [patient_id, req.user.id, file_url, file_name, file_size, file_type, title || null, notes || null]
    );

    return success(res, 201, 'Record created', { id: result.insertId, file_url });
});
// GET /api/records?patient_id=1
const getAllRecords = asyncHandler(async (req, res) => {
    const { patient_id } = req.query;

    if (!patient_id) {
        return error(res, 400, 'patient_id is required');
    }

    const [rows] = await pool.query(
        `SELECT r.id, r.file_url, r.file_name, r.file_size, r.file_type, 
                r.title, r.notes, r.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name
         FROM records r
         INNER JOIN users u ON u.id = r.uploaded_by
         WHERE r.patient_id = ? AND r.isDeleted = false
         ORDER BY r.created_at DESC`,
        [patient_id]
    );

    return success(res, 200, 'Records fetched', rows);
});

// GET /api/records/:id
const getRecordById = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT r.id, r.file_url, r.file_name, r.file_size, r.file_type, r.title, r.notes, r.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code
         FROM records r
         INNER JOIN users u ON u.id = r.uploaded_by
         INNER JOIN patients p ON p.id = r.patient_id
         WHERE r.id = ? AND r.isDeleted = false`,
        [req.params.id]
    );

    if (rows.length === 0) {
        return error(res, 404, 'Record not found');
    }

    return success(res, 200, 'Record fetched', rows[0]);
});

// DELETE /api/records/:id
const deleteRecord = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM records WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Record not found');
    }

    await pool.query('UPDATE records SET isDeleted = true WHERE id = ?', [req.params.id]);

    return success(res, 200, 'Record deleted');
});

// POST /api/records/upload/single
const uploadSingle = asyncHandler(async (req, res) => {
    if (!req.file) {
        return error(res, 400, 'File is required');
    }

    return success(res, 200, 'File uploaded', {
        file_url: `/uploads/${req.file.filename}`,
        file_name: req.file.originalname,
        file_size: Math.round(req.file.size / 1024),
    });
});

// POST /api/records/upload/multiple
const uploadMultiple = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return error(res, 400, 'Files are required');
    }

    const files = req.files.map((f) => ({
        file_url: `/uploads/${f.filename}`,
        file_name: f.originalname,
        file_size: Math.round(f.size / 1024),
    }));

    return success(res, 200, 'Files uploaded', files);
});

module.exports = { createRecord, getRecordById, deleteRecord, uploadSingle, uploadMultiple, getAllRecords };

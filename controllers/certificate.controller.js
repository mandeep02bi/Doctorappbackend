const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// POST /api/certificates
const createCertificate = asyncHandler(async (req, res) => {
    const { patient_id, title, content, valid_until } = req.body;

    // Verify patient exists
    const [patient] = await pool.query('SELECT id FROM patients WHERE id = ? AND isDeleted = false', [patient_id]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    const [result] = await pool.query(
        'INSERT INTO certificates (patient_id, doctor_id, title, content, valid_until) VALUES (?, ?, ?, ?, ?)',
        [patient_id, req.user.id, title, content, valid_until || null]
    );

    return success(res, 201, 'Certificate created', { id: result.insertId });
});

// GET /api/certificates
const getAllCertificates = asyncHandler(async (req, res) => {
    let query = `
        SELECT c.id, c.title, c.valid_until, c.created_at,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code,
               c.doctor_id
        FROM certificates c
        INNER JOIN patients p ON p.id = c.patient_id
        INNER JOIN users d ON d.id = c.doctor_id
        WHERE c.isDeleted = false`;

    const params = [];

    // Doctor can only see own certificates (Staff and Admin see all)
    if (req.user.role === 'Doctor') {
        query += ' AND c.doctor_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.query(query, params);

    return success(res, 200, 'Certificates fetched', rows);
});

// GET /api/certificates/:id
const getCertificateById = asyncHandler(async (req, res) => {
    let query = `
        SELECT c.id, c.title, c.content, c.valid_until, c.created_at,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, c.doctor_id
        FROM certificates c
        INNER JOIN patients p ON p.id = c.patient_id
        INNER JOIN users d ON d.id = c.doctor_id
        WHERE c.id = ? AND c.isDeleted = false`;

    const params = [req.params.id];

    if (req.user.role === 'Doctor') {
        query += ' AND c.doctor_id = ?';
        params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
        return error(res, 404, 'Certificate not found');
    }

    return success(res, 200, 'Certificate fetched', rows[0]);
});

// PUT /api/certificates/:id
const updateCertificate = asyncHandler(async (req, res) => {
    const { title, content, valid_until } = req.body;

    await pool.query(
        'UPDATE certificates SET title = ?, content = ?, valid_until = ? WHERE id = ? AND isDeleted = false',
        [title, content, valid_until || null, req.params.id]
    );

    return success(res, 200, 'Certificate updated');
});

// DELETE /api/certificates/:id
const deleteCertificate = asyncHandler(async (req, res) => {
    await pool.query('UPDATE certificates SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Certificate deleted');
});

module.exports = { createCertificate, getAllCertificates, getCertificateById, updateCertificate, deleteCertificate };

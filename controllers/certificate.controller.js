const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// #36 POST /api/certificates (PDF limit checked in middleware)
const createCertificate = asyncHandler(async (req, res) => {
    const { patient_code, title, description, certificate_date } = req.body;
    if (!patient_code || !title || !description) return error(res, 400, 'Patient code, title and description are required');

    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [patient_code]);
    if (patient.length === 0) return error(res, 404, 'Patient not found');

    const [result] = await pool.query(
        'INSERT INTO certificates (patient_id, doctor_id, title, description, certificate_date) VALUES (?, ?, ?, ?, ?)',
        [patient[0].id, req.user.id, title, description, certificate_date || null]
    );

    return success(res, 201, 'Certificate created', { id: result.insertId });
});

// #37 GET /api/certificates
const getAllCertificates = asyncHandler(async (req, res) => {
    const { patient_code, sort } = req.query;
    let query = `
        SELECT c.id, c.title, c.description, c.certificate_date, c.created_at,
               CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name, p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM certificates c
        INNER JOIN patients p ON p.id = c.patient_id
        INNER JOIN users d ON d.id = c.doctor_id
        WHERE c.isDeleted = false`;
    const params = [];

    if (req.user.role === 'Doctor') { query += ' AND c.doctor_id = ?'; params.push(req.user.id); }
    if (patient_code) { query += ' AND p.patient_code = ?'; params.push(patient_code); }
    query += sort === 'oldest' ? ' ORDER BY c.created_at ASC' : ' ORDER BY c.created_at DESC';

    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Certificates fetched', rows);
});

// #38 GET /api/certificates/:id
const getCertificate = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT c.*, CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name,
               p.patient_code, p.gender, p.age, p.blood_group,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM certificates c
        INNER JOIN patients p ON p.id = c.patient_id
        INNER JOIN users d ON d.id = c.doctor_id
        WHERE c.id = ? AND c.isDeleted = false`, [req.params.id]);

    if (rows.length === 0) return error(res, 404, 'Certificate not found');
    const cert = rows[0]; delete cert.isDeleted;
    return success(res, 200, 'Certificate fetched', cert);
});

// #39 PUT /api/certificates/:id
const updateCertificate = asyncHandler(async (req, res) => {
    const { title, description, certificate_date } = req.body;
    await pool.query('UPDATE certificates SET title = ?, description = ?, certificate_date = ? WHERE id = ? AND isDeleted = false', [title, description, certificate_date || null, req.params.id]);
    return success(res, 200, 'Certificate updated');
});

// #40 DELETE /api/certificates/:id
const deleteCertificate = asyncHandler(async (req, res) => {
    await pool.query('UPDATE certificates SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Certificate deleted');
});

module.exports = { createCertificate, getAllCertificates, getCertificate, updateCertificate, deleteCertificate };

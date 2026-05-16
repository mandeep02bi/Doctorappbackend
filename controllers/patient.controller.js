const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// POST /api/patients
const createPatient = asyncHandler(async (req, res) => {
    const {
        first_name, last_name, email, phone,
        date_of_birth, gender, blood_group,
        height_cm, weight_kg, pulse, respiratory_rate,
        allergies, past_medical_history,
        street_address, city, state, zip_code,
    } = req.body;

    const [result] = await pool.query(
        `INSERT INTO patients
         (created_by_staff_id, first_name, last_name, email, phone,
          date_of_birth, gender, blood_group, height_cm, weight_kg,
          pulse, respiratory_rate, allergies, past_medical_history,
          street_address, city, state, zip_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            req.user.id, first_name, last_name, email || null, phone || null,
            date_of_birth || null, gender || null, blood_group || null,
            height_cm || null, weight_kg || null, pulse || null, respiratory_rate || null,
            allergies || null, past_medical_history || null,
            street_address || null, city || null, state || null, zip_code || null,
        ]
    );

    const [patient] = await pool.query(
        'SELECT id, patient_code, first_name, last_name, email, phone FROM patients WHERE id = ?',
        [result.insertId]
    );

    return success(res, 201, 'Patient created', patient[0]);
});

// GET /api/patients
const getAllPatients = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT id, patient_code, first_name, last_name, email, phone,
                gender, date_of_birth, blood_group, city, created_at
         FROM patients WHERE isDeleted = false ORDER BY created_at DESC`
    );

    return success(res, 200, 'Patients fetched', rows);
});

// GET /api/patients/:id
const getPatientById = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT p.id, p.patient_code, p.first_name, p.last_name, p.email, p.phone,
                p.date_of_birth, p.gender, p.blood_group, p.height_cm, p.weight_kg,
                p.pulse, p.respiratory_rate, p.allergies, p.past_medical_history,
                p.street_address, p.city, p.state, p.zip_code, p.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by
         FROM patients p
         INNER JOIN users u ON u.id = p.created_by_staff_id
         WHERE p.id = ? AND p.isDeleted = false`,
        [req.params.id]
    );

    if (rows.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    return success(res, 200, 'Patient fetched', rows[0]);
});

// PUT /api/patients/:id
const updatePatient = asyncHandler(async (req, res) => {
    const {
        first_name, last_name, email, phone,
        date_of_birth, gender, blood_group,
        height_cm, weight_kg, pulse, respiratory_rate,
        allergies, past_medical_history,
        street_address, city, state, zip_code,
    } = req.body;

    const [existing] = await pool.query(
        'SELECT id FROM patients WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    await pool.query(
        `UPDATE patients SET
            first_name = ?, last_name = ?, email = ?, phone = ?,
            date_of_birth = ?, gender = ?, blood_group = ?,
            height_cm = ?, weight_kg = ?, pulse = ?, respiratory_rate = ?,
            allergies = ?, past_medical_history = ?,
            street_address = ?, city = ?, state = ?, zip_code = ?
         WHERE id = ?`,
        [
            first_name, last_name, email || null, phone || null,
            date_of_birth || null, gender || null, blood_group || null,
            height_cm || null, weight_kg || null, pulse || null, respiratory_rate || null,
            allergies || null, past_medical_history || null,
            street_address || null, city || null, state || null, zip_code || null,
            req.params.id,
        ]
    );

    return success(res, 200, 'Patient updated');
});

// DELETE /api/patients/:id
const deletePatient = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM patients WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    await pool.query('UPDATE patients SET isDeleted = true WHERE id = ?', [req.params.id]);

    return success(res, 200, 'Patient deleted');
});

// GET /api/patients/search?q=
const searchPatients = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return error(res, 400, 'Search query is required');
    }

    const term = `%${q}%`;

    const [rows] = await pool.query(
        `SELECT id, patient_code, first_name, last_name, email, phone, city
         FROM patients
         WHERE isDeleted = false
           AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
                OR phone LIKE ? OR patient_code LIKE ? OR city LIKE ?)
         ORDER BY first_name ASC`,
        [term, term, term, term, term, term]
    );

    return success(res, 200, 'Search results', rows);
});

// GET /api/patients/:id/timeline
const getPatientTimeline = asyncHandler(async (req, res) => {
    const patientId = req.params.id;

    const [timeline] = await pool.query(
        `SELECT 'appointment' AS type, id, created_at, CAST(status AS CHAR) COLLATE utf8mb4_general_ci AS extra FROM appointments WHERE patient_id = ? AND isDeleted = false
         UNION ALL
         SELECT 'prescription' AS type, id, created_at, diagnosis COLLATE utf8mb4_general_ci AS extra FROM prescriptions WHERE patient_id = ? AND isDeleted = false
         UNION ALL
         SELECT 'record' AS type, id, created_at, CAST(file_type AS CHAR) COLLATE utf8mb4_general_ci AS extra FROM records WHERE patient_id = ? AND isDeleted = false
         UNION ALL
         SELECT 'reminder' AS type, id, created_at, title COLLATE utf8mb4_general_ci AS extra FROM reminders WHERE patient_id = ? AND isDeleted = false
         ORDER BY created_at DESC`,
        [patientId, patientId, patientId, patientId]
    );

    return success(res, 200, 'Timeline fetched', timeline);
});

module.exports = { createPatient, getAllPatients, getPatientById, updatePatient, deletePatient, searchPatients, getPatientTimeline };
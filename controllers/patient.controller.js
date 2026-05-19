const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// #11 POST /api/patients
const createPatient = asyncHandler(async (req, res) => {
    const { first_name, middle_name, last_name, email, phone, date_of_birth, age, gender, blood_group, street_address, city, state, zip_code } = req.body;

    if (!first_name || !last_name) {
        return error(res, 400, 'First name and last name are required');
    }

    const [result] = await pool.query(
        `INSERT INTO patients (created_by, first_name, middle_name, last_name, email, phone, date_of_birth, age, gender, blood_group, street_address, city, state, zip_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, first_name, middle_name || null, last_name, email || null, phone || null, date_of_birth || null, age || null, gender || null, blood_group || null, street_address || null, city || null, state || null, zip_code || null]
    );

    const [patient] = await pool.query('SELECT patient_code, first_name, middle_name, last_name, phone FROM patients WHERE id = ?', [result.insertId]);

    return success(res, 201, 'Patient created', patient[0]);
});

// #12 GET /api/patients
const getAllPatients = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        'SELECT patient_code, first_name, middle_name, last_name, phone, gender, age, blood_group, city, created_at FROM patients WHERE isDeleted = false ORDER BY created_at DESC'
    );

    return success(res, 200, 'Patients fetched', rows);
});

// #13 GET /api/patients/:patient_code
const getPatient = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT p.patient_code, p.first_name, p.middle_name, p.last_name, p.email, p.phone, p.date_of_birth, p.age, p.gender, p.blood_group,
                p.street_address, p.city, p.state, p.zip_code, p.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
         FROM patients p
         INNER JOIN users u ON u.id = p.created_by
         WHERE p.patient_code = ? AND p.isDeleted = false`,
        [req.params.patient_code]
    );

    if (rows.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    return success(res, 200, 'Patient fetched', rows[0]);
});

// #14 PUT /api/patients/:patient_code
const updatePatient = asyncHandler(async (req, res) => {
    const { first_name, middle_name, last_name, email, phone, date_of_birth, age, gender, blood_group, street_address, city, state, zip_code } = req.body;

    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [req.params.patient_code]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    await pool.query(
        `UPDATE patients SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ?, date_of_birth = ?, age = ?, gender = ?, blood_group = ?, street_address = ?, city = ?, state = ?, zip_code = ?
         WHERE patient_code = ?`,
        [first_name, middle_name || null, last_name, email || null, phone || null, date_of_birth || null, age || null, gender || null, blood_group || null, street_address || null, city || null, state || null, zip_code || null, req.params.patient_code]
    );

    return success(res, 200, 'Patient updated');
});

// #15 DELETE /api/patients/:patient_code
const deletePatient = asyncHandler(async (req, res) => {
    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [req.params.patient_code]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    await pool.query('UPDATE patients SET isDeleted = true WHERE patient_code = ?', [req.params.patient_code]);

    return success(res, 200, 'Patient deleted');
});

// #16 GET /api/patients/search?q=
const searchPatients = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return success(res, 200, 'Search results', []);

    const search = `%${q}%`;
    const [rows] = await pool.query(
        `SELECT patient_code, first_name, middle_name, last_name, phone, gender, age, city
         FROM patients WHERE isDeleted = false AND (first_name LIKE ? OR middle_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR patient_code LIKE ?)
         ORDER BY first_name ASC LIMIT 20`,
        [search, search, search, search, search]
    );

    return success(res, 200, 'Search results', rows);
});

module.exports = { createPatient, getAllPatients, getPatient, updatePatient, deletePatient, searchPatients };

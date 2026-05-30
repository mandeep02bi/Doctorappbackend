const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// #11 POST /api/patients
const createPatient = asyncHandler(async (req, res) => {
    const { first_name, middle_name, last_name, email, phone, date_of_birth, age, gender, blood_group, street_address, city, state, zip_code, doctor_code } = req.body;

    if (!first_name || !last_name) return error(res, 400, 'First name and last name are required');

    // Determine doctor_id
    let doctorId = null;
    if (doctor_code) {
        const [doc] = await pool.query("SELECT id FROM users WHERE user_code = ? AND role = 'Doctor' AND isDeleted = false", [doctor_code]);
        if (doc.length === 0) return error(res, 404, 'Doctor not found');
        doctorId = doc[0].id;
    } else if (req.user.role === 'Doctor') {
        doctorId = req.user.id;
    }

    const [result] = await pool.query(
        `INSERT INTO patients (created_by, doctor_id, first_name, middle_name, last_name, email, phone, date_of_birth, age, gender, blood_group, street_address, city, state, zip_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, doctorId, first_name, middle_name || null, last_name, email || null, phone || null, date_of_birth || null, age || null, gender || null, blood_group || null, street_address || null, city || null, state || null, zip_code || null]
    );

    const [patient] = await pool.query('SELECT patient_code, first_name, middle_name, last_name, phone FROM patients WHERE id = ?', [result.insertId]);
    return success(res, 201, 'Patient created', patient[0]);
});

// #12 GET /api/patients
const getAllPatients = asyncHandler(async (req, res) => {
    const { doctor_code } = req.query;

    let query = 'SELECT patient_code, first_name, middle_name, last_name, phone, gender, age, blood_group, city, created_at FROM patients WHERE isDeleted = false';
    const params = [];

    if (req.user.role === 'Doctor') {
        query += ' AND doctor_id = ?';
        params.push(req.user.id);
    } else if (doctor_code) {
        const [doc] = await pool.query("SELECT id FROM users WHERE user_code = ? AND role = 'Doctor' AND isDeleted = false", [doctor_code]);
        if (doc.length > 0) {
            query += ' AND doctor_id = ?';
            params.push(doc[0].id);
        }
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Patients fetched', rows);
});

// #13 GET /api/patients/:patient_code
const getPatient = asyncHandler(async (req, res) => {
    let query = `SELECT p.patient_code, p.first_name, p.middle_name, p.last_name, p.email, p.phone, p.date_of_birth, p.age, p.gender, p.blood_group,
                p.street_address, p.city, p.state, p.zip_code, p.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
                CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
         FROM patients p
         INNER JOIN users u ON u.id = p.created_by
         LEFT JOIN users d ON d.id = p.doctor_id
         WHERE p.patient_code = ? AND p.isDeleted = false`;
    const params = [req.params.patient_code];

    if (req.user.role === 'Doctor') {
        query += ' AND p.doctor_id = ?';
        params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return error(res, 404, 'Patient not found');
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
    let query = `SELECT patient_code, first_name, middle_name, last_name, phone, gender, age, city
         FROM patients WHERE isDeleted = false AND (first_name LIKE ? OR middle_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR patient_code LIKE ?)`;
    const params = [search, search, search, search, search];

    if (req.user.role === 'Doctor') {
        query += ' AND doctor_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY first_name ASC LIMIT 20';
    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Search results', rows);
});

module.exports = { createPatient, getAllPatients, getPatient, updatePatient, deletePatient, searchPatients };

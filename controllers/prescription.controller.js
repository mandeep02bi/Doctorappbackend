const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// #25 POST /api/prescriptions (PDF limit checked in middleware)
const createPrescription = asyncHandler(async (req, res) => {
    const { patient_code, appointment_id, temperature, height, weight, pulse, blood_pressure, blood_sugar, hemoglobin, spo2, respiration_rate, allergy, chief_complaint, history, findings, diagnosis, treatment_advice, end_note, follow_up_date, notes, prescription_date } = req.body;

    if (!patient_code) return error(res, 400, 'Patient code is required');

    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [patient_code]);
    if (patient.length === 0) return error(res, 404, 'Patient not found');

    const [result] = await pool.query(
        `INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, temperature, height, weight, pulse, blood_pressure, blood_sugar, hemoglobin, spo2, respiration_rate, allergy, chief_complaint, history, findings, diagnosis, treatment_advice, end_note, follow_up_date, notes, prescription_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patient[0].id, req.user.id, appointment_id || null, temperature || null, height || null, weight || null, pulse || null, blood_pressure || null, blood_sugar || null, hemoglobin || null, spo2 || null, respiration_rate || null, allergy || null, chief_complaint || null, history || null, findings || null, diagnosis || null, treatment_advice || null, end_note || null, follow_up_date || null, notes || null, prescription_date || null]
    );

    return success(res, 201, 'Prescription created', { id: result.insertId });
});

// #26 GET /api/prescriptions
const getAllPrescriptions = asyncHandler(async (req, res) => {
    const { patient_code, sort } = req.query;

    let query = `
        SELECT pr.id, pr.diagnosis, pr.chief_complaint, pr.prescription_date, pr.follow_up_date, pr.created_at,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code,
               CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name, p.patient_code
        FROM prescriptions pr
        INNER JOIN users d ON d.id = pr.doctor_id
        INNER JOIN patients p ON p.id = pr.patient_id
        WHERE pr.isDeleted = false`;
    const params = [];

    if (req.user.role === 'Doctor') {
        query += ' AND pr.doctor_id = ?';
        params.push(req.user.id);
    }

    if (patient_code) {
        query += ' AND p.patient_code = ?';
        params.push(patient_code);
    }

    query += sort === 'oldest' ? ' ORDER BY pr.prescription_date ASC, pr.created_at ASC' : ' ORDER BY pr.prescription_date DESC, pr.created_at DESC';

    const [rows] = await pool.query(query, params);

    return success(res, 200, 'Prescriptions fetched', rows);
});

// #27 GET /api/prescriptions/:id
const getPrescription = asyncHandler(async (req, res) => {
    let query = `
        SELECT pr.*,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code,
               CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name,
               p.patient_code, p.gender, p.date_of_birth, p.age, p.phone AS patient_phone, p.street_address, p.city
        FROM prescriptions pr
        INNER JOIN users d ON d.id = pr.doctor_id
        INNER JOIN patients p ON p.id = pr.patient_id
        WHERE pr.id = ? AND pr.isDeleted = false`;
    const params = [req.params.id];

    if (req.user.role === 'Doctor') {
        query += ' AND pr.doctor_id = ?';
        params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return error(res, 404, 'Prescription not found');

    const [medicines] = await pool.query('SELECT id, name, total_quantity, frequency, route_form, no_of_days, instructions, additional_comments FROM prescription_medicines WHERE prescription_id = ?', [req.params.id]);
    const [labTests] = await pool.query('SELECT id, test_name, additional_comments FROM prescription_lab_tests WHERE prescription_id = ?', [req.params.id]);

    const prescription = rows[0];
    delete prescription.isDeleted;

    return success(res, 200, 'Prescription fetched', { ...prescription, medicines, lab_tests: labTests });
});

// #28 PUT /api/prescriptions/:id
const updatePrescription = asyncHandler(async (req, res) => {
    const { temperature, height, weight, pulse, blood_pressure, blood_sugar, hemoglobin, spo2, respiration_rate, allergy, chief_complaint, history, findings, diagnosis, treatment_advice, end_note, follow_up_date, notes, prescription_date } = req.body;

    await pool.query(
        `UPDATE prescriptions SET temperature = ?, height = ?, weight = ?, pulse = ?, blood_pressure = ?, blood_sugar = ?, hemoglobin = ?, spo2 = ?, respiration_rate = ?, allergy = ?, chief_complaint = ?, history = ?, findings = ?, diagnosis = ?, treatment_advice = ?, end_note = ?, follow_up_date = ?, notes = ?, prescription_date = ? WHERE id = ? AND isDeleted = false`,
        [temperature || null, height || null, weight || null, pulse || null, blood_pressure || null, blood_sugar || null, hemoglobin || null, spo2 || null, respiration_rate || null, allergy || null, chief_complaint || null, history || null, findings || null, diagnosis || null, treatment_advice || null, end_note || null, follow_up_date || null, notes || null, prescription_date || null, req.params.id]
    );

    return success(res, 200, 'Prescription updated');
});

// #29 DELETE /api/prescriptions/:id
const deletePrescription = asyncHandler(async (req, res) => {
    await pool.query('UPDATE prescriptions SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Prescription deleted');
});

// #30 POST /api/prescriptions/:id/medicines
const addMedicine = asyncHandler(async (req, res) => {
    const { name, total_quantity, frequency, route_form, no_of_days, instructions, additional_comments } = req.body;
    if (!name) return error(res, 400, 'Medicine name is required');

    const [result] = await pool.query(
        'INSERT INTO prescription_medicines (prescription_id, name, total_quantity, frequency, route_form, no_of_days, instructions, additional_comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, name, total_quantity || null, frequency || null, route_form || null, no_of_days || null, instructions || null, additional_comments || null]
    );

    return success(res, 201, 'Medicine added', { id: result.insertId });
});

// #31 PUT /api/prescriptions/:id/medicines/:medicineId
const updateMedicine = asyncHandler(async (req, res) => {
    const { name, total_quantity, frequency, route_form, no_of_days, instructions, additional_comments } = req.body;

    const [med] = await pool.query('SELECT id FROM prescription_medicines WHERE id = ? AND prescription_id = ?', [req.params.medicineId, req.params.id]);
    if (med.length === 0) return error(res, 404, 'Medicine not found');

    await pool.query(
        'UPDATE prescription_medicines SET name = ?, total_quantity = ?, frequency = ?, route_form = ?, no_of_days = ?, instructions = ?, additional_comments = ? WHERE id = ?',
        [name, total_quantity || null, frequency || null, route_form || null, no_of_days || null, instructions || null, additional_comments || null, req.params.medicineId]
    );

    return success(res, 200, 'Medicine updated');
});

// #32 DELETE /api/prescriptions/:id/medicines/:medicineId
const deleteMedicine = asyncHandler(async (req, res) => {
    const [med] = await pool.query('SELECT id FROM prescription_medicines WHERE id = ? AND prescription_id = ?', [req.params.medicineId, req.params.id]);
    if (med.length === 0) return error(res, 404, 'Medicine not found');

    await pool.query('DELETE FROM prescription_medicines WHERE id = ?', [req.params.medicineId]);
    return success(res, 200, 'Medicine deleted');
});

// #33 POST /api/prescriptions/:id/lab-tests
const addLabTest = asyncHandler(async (req, res) => {
    const { test_name, additional_comments } = req.body;
    if (!test_name) return error(res, 400, 'Test name is required');

    const [result] = await pool.query(
        'INSERT INTO prescription_lab_tests (prescription_id, test_name, additional_comments) VALUES (?, ?, ?)',
        [req.params.id, test_name, additional_comments || null]
    );

    return success(res, 201, 'Lab test added', { id: result.insertId });
});

// #34 PUT /api/prescriptions/:id/lab-tests/:labTestId
const updateLabTest = asyncHandler(async (req, res) => {
    const { test_name, additional_comments } = req.body;

    const [test] = await pool.query('SELECT id FROM prescription_lab_tests WHERE id = ? AND prescription_id = ?', [req.params.labTestId, req.params.id]);
    if (test.length === 0) return error(res, 404, 'Lab test not found');

    await pool.query('UPDATE prescription_lab_tests SET test_name = ?, additional_comments = ? WHERE id = ?', [test_name, additional_comments || null, req.params.labTestId]);

    return success(res, 200, 'Lab test updated');
});

// #35 DELETE /api/prescriptions/:id/lab-tests/:labTestId
const deleteLabTest = asyncHandler(async (req, res) => {
    const [test] = await pool.query('SELECT id FROM prescription_lab_tests WHERE id = ? AND prescription_id = ?', [req.params.labTestId, req.params.id]);
    if (test.length === 0) return error(res, 404, 'Lab test not found');

    await pool.query('DELETE FROM prescription_lab_tests WHERE id = ?', [req.params.labTestId]);
    return success(res, 200, 'Lab test deleted');
});

module.exports = { createPrescription, getAllPrescriptions, getPrescription, updatePrescription, deletePrescription, addMedicine, updateMedicine, deleteMedicine, addLabTest, updateLabTest, deleteLabTest };

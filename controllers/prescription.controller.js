const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// POST /api/prescriptions
const createPrescription = asyncHandler(async (req, res) => {
    const { patient_id, appointment_id, diagnosis, notes } = req.body;

    // Verify patient exists
    const [patient] = await pool.query('SELECT id FROM patients WHERE id = ? AND isDeleted = false', [patient_id]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    const [result] = await pool.query(
        `INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, diagnosis, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [patient_id, req.user.id, appointment_id || null, diagnosis || null, notes || null]
    );

    return success(res, 201, 'Prescription created', { id: result.insertId });
});

// GET /api/prescriptions/:id
// GET /api/prescriptions/:id
const getPrescriptionById = asyncHandler(async (req, res) => {
    let query = `
        SELECT pr.id, pr.diagnosis, pr.notes, pr.created_at,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code
        FROM prescriptions pr
        INNER JOIN users d ON d.id = pr.doctor_id
        INNER JOIN patients p ON p.id = pr.patient_id
        WHERE pr.id = ? AND pr.isDeleted = false`;

    const params = [req.params.id];

    // Doctor can only see own prescriptions (Staff and Admin see all)
    if (req.user.role === 'Doctor') {
        query += ' AND pr.doctor_id = ?';
        params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
        return error(res, 404, 'Prescription not found');
    }

    // Fetch medicines
    const [medicines] = await pool.query(
        'SELECT id, name, dosage, frequency, duration, instructions FROM prescription_medicines WHERE prescription_id = ?',
        [req.params.id]
    );

    // Fetch lab tests
    const [labTests] = await pool.query(
        'SELECT id, test_name, notes FROM prescription_lab_tests WHERE prescription_id = ?',
        [req.params.id]
    );

    return success(res, 200, 'Prescription fetched', {
        ...rows[0],
        medicines,
        lab_tests: labTests,
    });
});

// PUT /api/prescriptions/:id
const updatePrescription = asyncHandler(async (req, res) => {
    const { diagnosis, notes } = req.body;

    await pool.query(
        'UPDATE prescriptions SET diagnosis = ?, notes = ? WHERE id = ? AND isDeleted = false',
        [diagnosis || null, notes || null, req.params.id]
    );

    return success(res, 200, 'Prescription updated');
});

// DELETE /api/prescriptions/:id
const deletePrescription = asyncHandler(async (req, res) => {
    await pool.query('UPDATE prescriptions SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Prescription deleted');
});

// POST /api/prescriptions/:id/medicines
const addMedicine = asyncHandler(async (req, res) => {
    const { name, dosage, frequency, duration, instructions } = req.body;

    const [result] = await pool.query(
        `INSERT INTO prescription_medicines (prescription_id, name, dosage, frequency, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, name, dosage || null, frequency || null, duration || null, instructions || null]
    );

    return success(res, 201, 'Medicine added', { id: result.insertId });
});

// PUT /api/prescriptions/:id/medicines/:medicineId
const updateMedicine = asyncHandler(async (req, res) => {
    const { name, dosage, frequency, duration, instructions } = req.body;

    const [existing] = await pool.query(
        'SELECT id FROM prescription_medicines WHERE id = ? AND prescription_id = ?',
        [req.params.medicineId, req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Medicine not found');
    }

    await pool.query(
        `UPDATE prescription_medicines SET name = ?, dosage = ?, frequency = ?, duration = ?, instructions = ?
         WHERE id = ?`,
        [name, dosage || null, frequency || null, duration || null, instructions || null, req.params.medicineId]
    );

    return success(res, 200, 'Medicine updated');
});

// DELETE /api/prescriptions/:id/medicines/:medicineId
const deleteMedicine = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM prescription_medicines WHERE id = ? AND prescription_id = ?',
        [req.params.medicineId, req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Medicine not found');
    }

    await pool.query('DELETE FROM prescription_medicines WHERE id = ?', [req.params.medicineId]);

    return success(res, 200, 'Medicine deleted');
});

// POST /api/prescriptions/:id/lab-tests
const addLabTest = asyncHandler(async (req, res) => {
    const { test_name, notes } = req.body;

    const [result] = await pool.query(
        'INSERT INTO prescription_lab_tests (prescription_id, test_name, notes) VALUES (?, ?, ?)',
        [req.params.id, test_name, notes || null]
    );

    return success(res, 201, 'Lab test added', { id: result.insertId });
});

// DELETE /api/prescriptions/:id/lab-tests/:labTestId
const deleteLabTest = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM prescription_lab_tests WHERE id = ? AND prescription_id = ?',
        [req.params.labTestId, req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Lab test not found');
    }

    await pool.query('DELETE FROM prescription_lab_tests WHERE id = ?', [req.params.labTestId]);

    return success(res, 200, 'Lab test deleted');
});

module.exports = {
    createPrescription, getPrescriptionById, updatePrescription, deletePrescription,
    addMedicine, updateMedicine, deleteMedicine, addLabTest, deleteLabTest,
};

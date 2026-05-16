const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// POST /api/appointments
const createAppointment = asyncHandler(async (req, res) => {
    const { patient_id, doctor_id, appointment_date, reason, notes } = req.body;

    // Verify patient exists
    const [patient] = await pool.query('SELECT id FROM patients WHERE id = ? AND isDeleted = false', [patient_id]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    // Verify doctor exists and is a Doctor
    const [doctor] = await pool.query('SELECT id FROM users WHERE id = ? AND role = ? AND isDeleted = false', [doctor_id, 'Doctor']);
    if (doctor.length === 0) {
        return error(res, 404, 'Doctor not found');
    }

    const [result] = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, booked_by, appointment_date, reason, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [patient_id, doctor_id, req.user.id, appointment_date, reason || null, notes || null]
    );

    return success(res, 201, 'Appointment created', { id: result.insertId });
});

// GET /api/appointments
const getAllAppointments = asyncHandler(async (req, res) => {
    let query = `
        SELECT a.id, a.appointment_date, a.reason, a.status, a.created_at,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        INNER JOIN users d ON d.id = a.doctor_id
        WHERE a.isDeleted = false`;

    const params = [];

    // Doctor can only see their own appointments
    if (req.user.role === 'Doctor') {
        query += ' AND a.doctor_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY a.appointment_date DESC';

    const [rows] = await pool.query(query, params);

    return success(res, 200, 'Appointments fetched', rows);
});

// GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
    let query = `
        SELECT a.id, a.appointment_date, a.reason, a.notes, a.status, a.created_at,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code,
               CONCAT(b.first_name, ' ', b.last_name) AS booked_by_name
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        INNER JOIN users d ON d.id = a.doctor_id
        INNER JOIN users b ON b.id = a.booked_by
        WHERE a.id = ? AND a.isDeleted = false`;

    const params = [req.params.id];

    // Doctor can only see their own
    if (req.user.role === 'Doctor') {
        query += ' AND a.doctor_id = ?';
        params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
        return error(res, 404, 'Appointment not found');
    }

    return success(res, 200, 'Appointment fetched', rows[0]);
});

// PUT /api/appointments/:id
const updateAppointment = asyncHandler(async (req, res) => {
    const { appointment_date, reason, notes } = req.body;

    const [existing] = await pool.query(
        'SELECT id FROM appointments WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Appointment not found');
    }

    await pool.query(
        'UPDATE appointments SET appointment_date = ?, reason = ?, notes = ? WHERE id = ?',
        [appointment_date, reason || null, notes || null, req.params.id]
    );

    return success(res, 200, 'Appointment updated');
});

// PATCH /api/appointments/:id/status
const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
        return error(res, 400, 'Invalid status');
    }

    const [existing] = await pool.query(
        'SELECT id FROM appointments WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Appointment not found');
    }

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);

    return success(res, 200, 'Status updated');
});

// DELETE /api/appointments/:id
const deleteAppointment = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM appointments WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Appointment not found');
    }

    await pool.query('UPDATE appointments SET isDeleted = true WHERE id = ?', [req.params.id]);

    return success(res, 200, 'Appointment deleted');
});

module.exports = { createAppointment, getAllAppointments, getAppointmentById, updateAppointment, updateAppointmentStatus, deleteAppointment };

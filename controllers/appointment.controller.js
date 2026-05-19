const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// Helper: get doctor id (auto-assign single doctor)
const getDoctorId = async (userId) => {
    const [doctors] = await pool.query('SELECT id FROM users WHERE role = "Doctor" AND isDeleted = false AND isVerified = true LIMIT 1');
    if (doctors.length === 0) return userId; // fallback to current user
    return doctors[0].id;
};

// #17 POST /api/appointments
const createAppointment = asyncHandler(async (req, res) => {
    const { patient_code, patient_name, patient_gender, patient_age, patient_age_unit, patient_dob, patient_whatsapp, patient_email, appointment_date, appointment_time, purpose, notes } = req.body;

    if (!appointment_date || !appointment_time) {
        return error(res, 400, 'Appointment date and time are required');
    }

    let patientId = null;
    let pName = patient_name;

    // Way 1: existing patient
    if (patient_code) {
        const [patient] = await pool.query('SELECT id, first_name, middle_name, last_name FROM patients WHERE patient_code = ? AND isDeleted = false', [patient_code]);
        if (patient.length === 0) return error(res, 404, 'Patient not found');
        patientId = patient[0].id;
        pName = [patient[0].first_name, patient[0].middle_name, patient[0].last_name].filter(Boolean).join(' ');
    } else {
        // Way 2: walk-in
        if (!patient_name) return error(res, 400, 'Patient name is required for walk-in');
    }

    const doctorId = await getDoctorId(req.user.id);

    const [result] = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, booked_by, patient_name, patient_gender, patient_age, patient_age_unit, patient_dob, patient_whatsapp, patient_email, appointment_date, appointment_time, purpose, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientId, doctorId, req.user.id, pName, patient_gender || null, patient_age || null, patient_age_unit || 'Year', patient_dob || null, patient_whatsapp || null, patient_email || null, appointment_date, appointment_time, purpose || null, notes || null]
    );

    return success(res, 201, 'Appointment created', { id: result.insertId });
});

// #18 GET /api/appointments
const getAllAppointments = asyncHandler(async (req, res) => {
    const { patient_code, filter, sort } = req.query;

    let query = `
        SELECT a.id, a.patient_name, a.patient_gender, a.patient_age, a.patient_age_unit, a.patient_whatsapp,
               a.appointment_date, a.appointment_time, a.purpose, a.status,
               p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code,
               (a.patient_id IS NULL) AS is_walkin, a.created_at
        FROM appointments a
        LEFT JOIN patients p ON p.id = a.patient_id
        INNER JOIN users d ON d.id = a.doctor_id
        WHERE a.isDeleted = false`;
    const params = [];

    if (req.user.role === 'Doctor') {
        query += ' AND a.doctor_id = ?';
        params.push(req.user.id);
    }

    if (patient_code) {
        query += ' AND p.patient_code = ?';
        params.push(patient_code);
    }

    if (filter === 'today') {
        query += ' AND a.appointment_date = CURDATE()';
    } else if (filter === 'history') {
        query += ' AND (a.status IN ("Completed", "Cancelled") OR a.appointment_date < CURDATE())';
    } else if (filter === 'upcoming') {
        query += ' AND a.status IN ("Pending", "Confirmed") AND a.appointment_date >= CURDATE()';
    }

    query += sort === 'oldest' ? ' ORDER BY a.appointment_date ASC, a.appointment_time ASC' : ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [rows] = await pool.query(query, params);

    return success(res, 200, 'Appointments fetched', rows);
});

// #19 GET /api/appointments/today
const todayAppointments = asyncHandler(async (req, res) => {
    let query = `
        SELECT a.id, a.patient_name, a.appointment_time, a.purpose, a.status,
               p.patient_code, (a.patient_id IS NULL) AS is_walkin
        FROM appointments a
        LEFT JOIN patients p ON p.id = a.patient_id
        WHERE a.isDeleted = false AND a.appointment_date = CURDATE()`;
    const params = [];

    if (req.user.role === 'Doctor') {
        query += ' AND a.doctor_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY a.appointment_time ASC';

    const [rows] = await pool.query(query, params);

    return success(res, 200, "Today's appointments fetched", rows);
});

// #20 GET /api/appointments/calendar?month=2026-05
const calendarAppointments = asyncHandler(async (req, res) => {
    const { month } = req.query;
    if (!month) return error(res, 400, 'Month parameter is required (YYYY-MM)');

    let query = `
        SELECT a.id, a.patient_name, a.appointment_date, a.appointment_time, a.status,
               p.patient_code
        FROM appointments a
        LEFT JOIN patients p ON p.id = a.patient_id
        WHERE a.isDeleted = false AND DATE_FORMAT(a.appointment_date, '%Y-%m') = ?`;
    const params = [month];

    if (req.user.role === 'Doctor') {
        query += ' AND a.doctor_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

    const [rows] = await pool.query(query, params);

    // Group by date
    const calendar = {};
    rows.forEach(r => {
        const dateKey = r.appointment_date instanceof Date
            ? r.appointment_date.toISOString().split('T')[0]
            : r.appointment_date;
        if (!calendar[dateKey]) calendar[dateKey] = [];
        calendar[dateKey].push(r);
    });

    return success(res, 200, 'Calendar appointments fetched', calendar);
});

// #21 GET /api/appointments/:id
const getAppointment = asyncHandler(async (req, res) => {
    let query = `
        SELECT a.*, p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code,
               CONCAT(b.first_name, ' ', b.last_name) AS booked_by_name,
               (a.patient_id IS NULL) AS is_walkin
        FROM appointments a
        LEFT JOIN patients p ON p.id = a.patient_id
        INNER JOIN users d ON d.id = a.doctor_id
        INNER JOIN users b ON b.id = a.booked_by
        WHERE a.id = ? AND a.isDeleted = false`;
    const params = [req.params.id];

    if (req.user.role === 'Doctor') {
        query += ' AND a.doctor_id = ?';
        params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return error(res, 404, 'Appointment not found');

    const appt = rows[0];
    delete appt.isDeleted;

    return success(res, 200, 'Appointment fetched', appt);
});

// #22 PUT /api/appointments/:id
const updateAppointment = asyncHandler(async (req, res) => {
    const { patient_name, patient_gender, patient_age, patient_age_unit, patient_dob, patient_whatsapp, patient_email, appointment_date, appointment_time, purpose, notes } = req.body;

    const [appt] = await pool.query('SELECT id FROM appointments WHERE id = ? AND isDeleted = false', [req.params.id]);
    if (appt.length === 0) return error(res, 404, 'Appointment not found');

    await pool.query(
        `UPDATE appointments SET patient_name = ?, patient_gender = ?, patient_age = ?, patient_age_unit = ?, patient_dob = ?, patient_whatsapp = ?, patient_email = ?, appointment_date = ?, appointment_time = ?, purpose = ?, notes = ? WHERE id = ?`,
        [patient_name, patient_gender || null, patient_age || null, patient_age_unit || 'Year', patient_dob || null, patient_whatsapp || null, patient_email || null, appointment_date, appointment_time, purpose || null, notes || null, req.params.id]
    );

    return success(res, 200, 'Appointment updated');
});

// #23 PATCH /api/appointments/:id/status
const updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const valid = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!valid.includes(status)) return error(res, 400, 'Invalid status');

    const [appt] = await pool.query('SELECT id FROM appointments WHERE id = ? AND isDeleted = false', [req.params.id]);
    if (appt.length === 0) return error(res, 404, 'Appointment not found');

    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);

    return success(res, 200, 'Status updated');
});

// #24 DELETE /api/appointments/:id
const deleteAppointment = asyncHandler(async (req, res) => {
    await pool.query('UPDATE appointments SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Appointment deleted');
});

module.exports = { createAppointment, getAllAppointments, todayAppointments, calendarAppointments, getAppointment, updateAppointment, updateStatus, deleteAppointment };

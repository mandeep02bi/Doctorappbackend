const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success } = require('../utils/response');

// #73 GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
    const isDoctor = req.user.role === 'Doctor';
    const doctorFilter = isDoctor ? ' AND doctor_id = ?' : '';
    const params = isDoctor ? [req.user.id] : [];

    const [[{ total_patients }]] = await pool.query('SELECT COUNT(*) AS total_patients FROM patients WHERE isDeleted = false');
    const [[{ total_appointments }]] = await pool.query(`SELECT COUNT(*) AS total_appointments FROM appointments WHERE isDeleted = false${doctorFilter}`, params);
    const [[{ pending_appointments }]] = await pool.query(`SELECT COUNT(*) AS pending_appointments FROM appointments WHERE isDeleted = false AND status = 'Pending'${doctorFilter}`, params);
    const [[{ unpaid_invoices }]] = await pool.query("SELECT COUNT(*) AS unpaid_invoices FROM invoices WHERE isDeleted = false AND status = 'To pay'");
    const [[{ total_revenue }]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM invoices WHERE isDeleted = false AND status = 'Paid'");

    let todayQuery = `SELECT a.id, a.patient_name, a.appointment_time, a.purpose, a.status, p.patient_code,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id INNER JOIN users d ON d.id = a.doctor_id
        WHERE a.isDeleted = false AND a.appointment_date = CURDATE()${doctorFilter}`;
    todayQuery += ' ORDER BY a.appointment_time ASC';

    const [today_appointments] = await pool.query(todayQuery, params);

    return success(res, 200, 'Dashboard data', {
        stats: { total_patients, total_appointments, pending_appointments, unpaid_invoices, total_revenue },
        today_appointments,
    });
});

module.exports = { getDashboard };

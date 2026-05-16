const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success } = require('../utils/response');

// GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
    // Summary counts
    const [stats] = await pool.query(`
        SELECT
            (SELECT COUNT(*) FROM patients     WHERE isDeleted = false)                          AS total_patients,
            (SELECT COUNT(*) FROM users        WHERE role = 'Doctor' AND isDeleted = false)      AS total_doctors,
            (SELECT COUNT(*) FROM users        WHERE role = 'Staff'  AND isDeleted = false)      AS total_staff,
            (SELECT COUNT(*) FROM appointments WHERE isDeleted = false)                          AS total_appointments,
            (SELECT COUNT(*) FROM appointments WHERE status = 'Pending'  AND isDeleted = false)  AS pending_appointments,
            (SELECT COUNT(*) FROM invoices     WHERE status = 'Unpaid'   AND isDeleted = false)  AS unpaid_invoices,
            (SELECT IFNULL(SUM(total_amount), 0) FROM invoices WHERE status = 'Paid' AND isDeleted = false) AS total_revenue
    `);

    // Today's appointments
    let appointmentQuery = `
        SELECT a.id, a.appointment_date, a.reason, a.status,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
               CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        INNER JOIN users d ON d.id = a.doctor_id
        WHERE DATE(a.appointment_date) = CURDATE() AND a.isDeleted = false`;

    const params = [];

    // Doctor sees only their own today's appointments
    if (req.user.role === 'Doctor') {
        appointmentQuery += ' AND a.doctor_id = ?';
        params.push(req.user.id);
    }

    appointmentQuery += ' ORDER BY a.appointment_date ASC';

    const [todayAppointments] = await pool.query(appointmentQuery, params);

    return success(res, 200, 'Dashboard data', {
        stats: stats[0],
        today_appointments: todayAppointments,
    });
});

module.exports = { getDashboard };

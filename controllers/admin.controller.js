const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// #70 GET /api/admin/dashboard
const adminDashboard = asyncHandler(async (req, res) => {
    const [[{ total_doctors }]] = await pool.query("SELECT COUNT(*) AS total_doctors FROM users WHERE role = 'Doctor' AND isDeleted = false");
    const [[{ total_staff }]] = await pool.query("SELECT COUNT(*) AS total_staff FROM users WHERE role = 'Staff' AND isDeleted = false");
    const [[{ pending_approvals }]] = await pool.query("SELECT COUNT(*) AS pending_approvals FROM users WHERE isVerified = false AND isDeleted = false AND role != 'Admin'");

    const [[{ total_patients }]] = await pool.query('SELECT COUNT(*) AS total_patients FROM patients WHERE isDeleted = false');
    const [[{ patients_this_month }]] = await pool.query("SELECT COUNT(*) AS patients_this_month FROM patients WHERE isDeleted = false AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
    const [[{ patients_today }]] = await pool.query("SELECT COUNT(*) AS patients_today FROM patients WHERE isDeleted = false AND DATE(created_at) = CURDATE()");

    const [[{ total_appointments }]] = await pool.query('SELECT COUNT(*) AS total_appointments FROM appointments WHERE isDeleted = false');
    const [[{ today_appointments }]] = await pool.query("SELECT COUNT(*) AS today_appointments FROM appointments WHERE isDeleted = false AND appointment_date = CURDATE()");
    const [[{ pending_appointments }]] = await pool.query("SELECT COUNT(*) AS pending_appointments FROM appointments WHERE isDeleted = false AND status = 'Pending'");
    const [[{ completed_this_month }]] = await pool.query("SELECT COUNT(*) AS completed_this_month FROM appointments WHERE isDeleted = false AND status = 'Completed' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");

    const [[{ total_prescriptions }]] = await pool.query('SELECT COUNT(*) AS total_prescriptions FROM prescriptions WHERE isDeleted = false');
    const [[{ prescriptions_this_month }]] = await pool.query("SELECT COUNT(*) AS prescriptions_this_month FROM prescriptions WHERE isDeleted = false AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
    const [[{ prescriptions_today }]] = await pool.query("SELECT COUNT(*) AS prescriptions_today FROM prescriptions WHERE isDeleted = false AND DATE(created_at) = CURDATE()");

    const [[{ total_invoices }]] = await pool.query('SELECT COUNT(*) AS total_invoices FROM invoices WHERE isDeleted = false');
    const [[{ unpaid_invoices }]] = await pool.query("SELECT COUNT(*) AS unpaid_invoices FROM invoices WHERE isDeleted = false AND status = 'To pay'");
    const [[{ total_revenue }]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM invoices WHERE isDeleted = false AND status = 'Paid'");
    const [[{ revenue_this_month }]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS revenue_this_month FROM invoices WHERE isDeleted = false AND status = 'Paid' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");

    // PDF usage
    const [usage] = await pool.query('SELECT total_count, max_limit FROM usage_counter LIMIT 1');
    const pdf_usage = usage.length > 0 ? { total_used: usage[0].total_count, max_limit: usage[0].max_limit, remaining: usage[0].max_limit - usage[0].total_count } : { total_used: 0, max_limit: 300, remaining: 300 };

    return success(res, 200, 'Admin dashboard', {
        users: { total_doctors, total_staff, pending_approvals },
        patients: { total: total_patients, added_this_month: patients_this_month, added_today: patients_today },
        appointments: { total: total_appointments, today: today_appointments, pending: pending_appointments, completed_this_month },
        prescriptions: { total: total_prescriptions, this_month: prescriptions_this_month, today: prescriptions_today },
        invoices: { total: total_invoices, unpaid: unpaid_invoices, total_revenue, revenue_this_month },
        pdf_usage,
    });
});

// #71 GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        "SELECT user_code, first_name, last_name, email, phone, role, isVerified, last_login_at, created_at FROM users WHERE isDeleted = false AND role != 'Admin' ORDER BY created_at DESC"
    );
    return success(res, 200, 'Users fetched', rows);
});

// #72 PATCH /api/admin/reset-limit/:user_code
const resetPdfLimit = asyncHandler(async (req, res) => {
    const { user_code } = req.params;
    const [user] = await pool.query('SELECT id FROM users WHERE user_code = ? AND isDeleted = false', [user_code]);
    if (user.length === 0) return error(res, 404, 'User not found');

    await pool.query('UPDATE usage_counter SET total_count = 0, reset_at = NOW() WHERE user_id = ?', [user[0].id]);
    return success(res, 200, 'PDF limit reset successfully');
});

module.exports = { adminDashboard, getAllUsers, resetPdfLimit };

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
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
    const { status } = req.query;

    let query = "SELECT user_code, first_name, last_name, email, phone, role, isVerified, isDeleted, last_login_at, created_at FROM users WHERE role != 'Admin'";

    if (status === 'approved') {
        query += ' AND isVerified = true AND isDeleted = false';
    } else if (status === 'pending') {
        query += ' AND isVerified = false AND isDeleted = false';
    } else if (status === 'rejected') {
        query += ' AND isDeleted = true';
    } else {
        query += ' AND isDeleted = false';
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query);
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
// #74 GET /api/admin/users/:user_code
const getUser = asyncHandler(async (req, res) => {
    const { user_code } = req.params;

    const [users] = await pool.query(
        "SELECT user_code, first_name, last_name, email, phone, role, isVerified, platform, device_type, last_login_at, created_at FROM users WHERE user_code = ? AND isDeleted = false AND role != 'Admin'",
        [user_code]
    );
    if (users.length === 0) return error(res, 404, 'User not found');

    const user = users[0];
    const userId = (await pool.query('SELECT id FROM users WHERE user_code = ?', [user_code]))[0][0].id;

    const [[{ total_appointments }]] = await pool.query('SELECT COUNT(*) AS total_appointments FROM appointments WHERE doctor_id = ? AND isDeleted = false', [userId]);
    const [[{ total_prescriptions }]] = await pool.query('SELECT COUNT(*) AS total_prescriptions FROM prescriptions WHERE doctor_id = ? AND isDeleted = false', [userId]);
    const [[{ total_certificates }]] = await pool.query('SELECT COUNT(*) AS total_certificates FROM certificates WHERE doctor_id = ? AND isDeleted = false', [userId]);
    const [[{ total_instructions }]] = await pool.query('SELECT COUNT(*) AS total_instructions FROM instructions WHERE doctor_id = ? AND isDeleted = false', [userId]);

    user.stats = { total_appointments, total_prescriptions, total_certificates, total_instructions };

    return success(res, 200, 'User fetched', user);
});

// #75 GET /api/admin/patients
const getAdminPatients = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT p.patient_code, p.first_name, p.middle_name, p.last_name, p.phone, p.gender, p.age, p.blood_group, p.city, p.created_at,
               CONCAT(u.first_name, ' ', u.last_name) AS created_by_name, u.role AS created_by_role,
               (SELECT COUNT(*) FROM prescriptions WHERE patient_id = p.id AND isDeleted = false) AS total_prescriptions,
               (SELECT COUNT(*) FROM appointments WHERE patient_id = p.id AND isDeleted = false) AS total_appointments,
               (SELECT COUNT(*) FROM invoices WHERE patient_id = p.id AND isDeleted = false) AS total_invoices
        FROM patients p
        INNER JOIN users u ON u.id = p.created_by
        WHERE p.isDeleted = false
        ORDER BY p.created_at DESC
    `);
    return success(res, 200, 'Patients fetched', rows);
});

// #76 GET /api/admin/patients/:patient_code
const getAdminPatient = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS created_by_name, u.role AS created_by_role
        FROM patients p
        INNER JOIN users u ON u.id = p.created_by
        WHERE p.patient_code = ? AND p.isDeleted = false`,
        [req.params.patient_code]
    );
    if (rows.length === 0) return error(res, 404, 'Patient not found');

    const patient = rows[0];
    delete patient.isDeleted;
    const pid = patient.id;

    const [[{ total_prescriptions }]] = await pool.query('SELECT COUNT(*) AS total_prescriptions FROM prescriptions WHERE patient_id = ? AND isDeleted = false', [pid]);
    const [[{ total_certificates }]] = await pool.query('SELECT COUNT(*) AS total_certificates FROM certificates WHERE patient_id = ? AND isDeleted = false', [pid]);
    const [[{ total_instructions }]] = await pool.query('SELECT COUNT(*) AS total_instructions FROM instructions WHERE patient_id = ? AND isDeleted = false', [pid]);
    const [[{ total_consents }]] = await pool.query('SELECT COUNT(*) AS total_consents FROM consents WHERE patient_id = ? AND isDeleted = false', [pid]);
    const [[{ total_invoices }]] = await pool.query('SELECT COUNT(*) AS total_invoices FROM invoices WHERE patient_id = ? AND isDeleted = false', [pid]);
    const [[{ total_appointments }]] = await pool.query('SELECT COUNT(*) AS total_appointments FROM appointments WHERE patient_id = ? AND isDeleted = false', [pid]);
    const [[{ total_reminders }]] = await pool.query('SELECT COUNT(*) AS total_reminders FROM reminders WHERE patient_id = ? AND isDeleted = false', [pid]);
    const [[{ unpaid_invoices }]] = await pool.query("SELECT COUNT(*) AS unpaid_invoices FROM invoices WHERE patient_id = ? AND isDeleted = false AND status = 'To pay'", [pid]);
    const [[{ total_revenue }]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM invoices WHERE patient_id = ? AND isDeleted = false AND status = 'Paid'", [pid]);

    patient.stats = { total_prescriptions, total_certificates, total_instructions, total_consents, total_invoices, total_appointments, total_reminders, unpaid_invoices, total_revenue };

    return success(res, 200, 'Patient fetched', patient);
});

// #78 DELETE /api/admin/users/:user_code
const deleteUser = asyncHandler(async (req, res) => {
    const { user_code } = req.params;

    const [users] = await pool.query('SELECT id, role FROM users WHERE user_code = ? AND isDeleted = false', [user_code]);
    if (users.length === 0) return error(res, 404, 'User not found');
    if (users[0].role === 'Admin') return error(res, 400, 'Cannot delete admin');

    await pool.query('UPDATE users SET isDeleted = true WHERE user_code = ?', [user_code]);
    return success(res, 200, 'User deleted');
});
// #75 POST /api/admin/create-user (Admin creates user, auto-verified)
const createUser = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone, password, role } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
        return error(res, 400, 'All fields are required');
    }

    if (!['Doctor', 'Staff'].includes(role)) {
        return error(res, 400, 'Role must be Doctor or Staff');
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        return error(res, 409, 'Email already registered');
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, phone || null, hash, role, true]
    );

    const [user] = await pool.query('SELECT user_code, first_name, last_name, email, role, isVerified FROM users WHERE id = ?', [result.insertId]);

    return success(res, 201, 'User created and verified', user[0]);
});
// #8 GET /api/admin/pending
const pending = asyncHandler(async (req, res) => {
    const [users] = await pool.query(
        'SELECT user_code, first_name, last_name, email, phone, role, created_at FROM users WHERE isVerified = false AND isDeleted = false AND role != ?',
        ['Admin']
    );

    return success(res, 200, 'Pending users fetched', users);
});

// #9 PATCH /api/admin/approve/:user_code
const approve = asyncHandler(async (req, res) => {
    const { user_code } = req.params;

    const [users] = await pool.query('SELECT id, role, isVerified FROM users WHERE user_code = ? AND isDeleted = false', [user_code]);
    if (users.length === 0) {
        return error(res, 404, 'User not found');
    }

    if (users[0].role === 'Admin') {
        return error(res, 400, 'Cannot approve admin');
    }

    if (users[0].isVerified) {
        return error(res, 400, 'User is already verified');
    }

    await pool.query('UPDATE users SET isVerified = true WHERE user_code = ?', [user_code]);

    return success(res, 200, 'User approved successfully');
});

// #10 PATCH /api/admin/reject/:user_code
const reject = asyncHandler(async (req, res) => {
    const { user_code } = req.params;

    const [users] = await pool.query('SELECT id, role FROM users WHERE user_code = ? AND isDeleted = false', [user_code]);
    if (users.length === 0) {
        return error(res, 404, 'User not found');
    }

    if (users[0].role === 'Admin') {
        return error(res, 400, 'Cannot reject admin');
    }

    await pool.query('UPDATE users SET isDeleted = true WHERE user_code = ?', [user_code]);

    return success(res, 200, 'User rejected and removed');
});
// PATCH /api/admin/change-password
const changePassword = asyncHandler(async (req, res) => {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) return error(res, 400, 'Old password and new password are required');

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(old_password, users[0].password);
    if (!match) return error(res, 401, 'Old password is incorrect');

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

    return success(res, 200, 'Password changed successfully');
});
// PATCH /api/admin/users/:user_code/role
// PATCH /api/admin/users/:user_code/role
const changeUserRole = asyncHandler(async (req, res) => {
    const { role: newRole } = req.body;
    if (!['Doctor', 'Staff'].includes(newRole)) return error(res, 400, 'Role must be Doctor or Staff');

    const [users] = await pool.query('SELECT id, role FROM users WHERE user_code = ? AND isDeleted = false', [req.params.user_code]);
    if (users.length === 0) return error(res, 404, 'User not found');
    if (users[0].role === 'Admin') return error(res, 400, 'Cannot change admin role');
    if (users[0].role === newRole) return error(res, 400, 'User already has this role');

    // Generate new code
    const prefix = newRole === 'Doctor' ? 'DR' : 'ST';
    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role = ?', [newRole]);
    const newCode = prefix + String(count + 1).padStart(4, '0');

    await pool.query('UPDATE users SET role = ?, user_code = ? WHERE id = ?', [newRole, newCode, users[0].id]);

    return success(res, 200, 'Role updated successfully', { new_user_code: newCode });
});

module.exports = { adminDashboard, getAllUsers, getUser, getAdminPatients, getAdminPatient, resetPdfLimit, deleteUser,createUser,approve,reject,pending,changePassword , changeUserRole };

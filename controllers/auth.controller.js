const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');

// #1 POST /api/auth/register
const register = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone, password, role, platform, device_type } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
        return error(res, 400, 'All fields are required');
    }

    if (role === 'Admin') {
        return error(res, 403, 'Admin registration is not allowed');
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
        'INSERT INTO users (first_name, last_name, email, phone, password, role, platform, device_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, phone || null, hash, role, platform || 'unknown', device_type || 'unknown']
    );

    const [user] = await pool.query('SELECT user_code, first_name, last_name, email, role FROM users WHERE id = ?', [result.insertId]);

    return success(res, 201, 'Registration successful. Please contact admin for account verification.', user[0]);
});

// #2 POST /api/auth/login
const login = asyncHandler(async (req, res) => {
    const { email, password, platform, device_type } = req.body;

    if (!email || !password) {
        return error(res, 400, 'Email and password are required');
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND isDeleted = false', [email]);
    if (users.length === 0) {
        return error(res, 401, 'Invalid email or password');
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return error(res, 401, 'Invalid email or password');
    }

    // Admin bypasses isVerified
    if (user.role !== 'Admin' && !user.isVerified) {
        return error(res, 403, 'Your account is not verified yet. Please contact your admin.');
    }

    const accessToken = jwt.sign(
        { id: user.id, role: user.role, user_code: user.user_code },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );

    await pool.query(
        'UPDATE users SET refresh_token = ?, last_login_at = NOW(), platform = ?, device_type = ? WHERE id = ?',
        [refreshToken, platform || user.platform, device_type || user.device_type, user.id]
    );

    return success(res, 200, 'Login successful', {
        user: { first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, user_code: user.user_code },
        accessToken,
        refreshToken,
    });
});

// #3 POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const [users] = await pool.query('SELECT id FROM users WHERE email = ? AND isDeleted = false', [email]);
    if (users.length === 0) {
        return error(res, 404, 'No account found with this email');
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await pool.query('UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?', [otp, expiry, email]);
    await sendEmail(email, 'Password Reset OTP - VimPal Smart Clinic', otp);

    return success(res, 200, 'OTP sent to your email');
});

// #4 POST /api/auth/verify-otp
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const [users] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND otp = ? AND otp_expiry > NOW()',
        [email, otp]
    );

    if (users.length === 0) {
        return error(res, 400, 'Invalid or expired OTP');
    }

    // Clear OTP after verification
    await pool.query('UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = ?', [email]);

    return success(res, 200, 'OTP verified successfully');
});

// #5 POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
        return error(res, 400, 'Email and new password are required');
    }

    const [users] = await pool.query('SELECT id FROM users WHERE email = ? AND isDeleted = false', [email]);
    if (users.length === 0) {
        return error(res, 404, 'User not found');
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hash, email]);

    return success(res, 200, 'Password reset successful');
});

// #6 GET /api/auth/me
const me = asyncHandler(async (req, res) => {
    const [users] = await pool.query(
        'SELECT user_code, first_name, last_name, email, phone, role, platform, device_type, last_login_at, created_at FROM users WHERE id = ? AND isDeleted = false',
        [req.user.id]
    );

    if (users.length === 0) {
        return error(res, 404, 'User not found');
    }

    return success(res, 200, 'Profile fetched', users[0]);
});

// #7 POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    return success(res, 200, 'Logged out successfully');
});

// #8 GET /api/auth/pending
const pending = asyncHandler(async (req, res) => {
    const [users] = await pool.query(
        'SELECT user_code, first_name, last_name, email, phone, role, created_at FROM users WHERE isVerified = false AND isDeleted = false AND role != ?',
        ['Admin']
    );

    return success(res, 200, 'Pending users fetched', users);
});

// #9 PATCH /api/auth/approve/:user_code
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

// #10 PATCH /api/auth/reject/:user_code
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

module.exports = { register, login, forgotPassword, verifyOTP, resetPassword, me, logout, pending, approve, reject };

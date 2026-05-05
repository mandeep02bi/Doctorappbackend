const db = require('../config/db');

// Find any active (non-deleted) user by email
exports.findUserByEmail = async (email) => {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ? AND isDeleted = false',
        [email]
    );
    return rows[0];
};

// Find any user by ID (including deleted check)
exports.findUserById = async (id) => {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE id = ? AND isDeleted = false',
        [id]
    );
    return rows[0];
};

// Create a new user row
exports.createUser = async (userData) => {
    const { first_name, last_name, email, phone = null, password, role, isVerified = false } = userData;
    const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, phone, password, role, isVerified]
    );
    // console.log(result);
    return result.insertId;
};

// Save OTP and its expiry for password reset flow
exports.updateUserOTP = async (userId, otp, otpExpiry) => {
    await db.query(
        'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?',
        [otp, otpExpiry, userId]
    );
};

// Reset password and clear OTP fields after successful verification
exports.updatePassword = async (userId, newHashedPassword) => {
    await db.query(
        'UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE id = ?',
        [newHashedPassword, userId]
    );
};

// Soft delete: sets isDeleted = true (never physically removes data)
exports.softDeleteUser = async (userId) => {
    await db.query(
        'UPDATE users SET isDeleted = true WHERE id = ?',
        [userId]
    );
};

// Admin: approve a Doctor or Nurse account
exports.verifyUser = async (userId) => {
    await db.query(
        'UPDATE users SET isVerified = true WHERE id = ? AND isDeleted = false',
        [userId]
    );
};

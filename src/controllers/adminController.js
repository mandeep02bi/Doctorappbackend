const db = require('../config/db');
const userModel = require('../models/userModel');
const authService = require('../services/auth.service');

// ============================================================
// GET /api/admin/unverified-users
// Admin sees all Doctor & Nurse accounts awaiting OTP verification
// ============================================================
exports.getUnverifiedUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, first_name, last_name, email, role, otp, otp_expiry, created_at
             FROM users
             WHERE role IN ('Doctor', 'Nurse') AND isVerified = false AND isDeleted = false
             ORDER BY created_at DESC`
        );
        res.status(200).json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// POST /api/admin/resend-otp
// Admin re-generates and resends OTP to a Doctor/Nurse
// (if they lost it or it expired)
// Body: { email: "doctor@email.com" }
// ============================================================
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'email is required.' });

        const { otp, user } = await authService.resendActivationOTP(email);

        res.status(200).json({
            success: true,
            message: `New OTP generated for ${user.first_name} ${user.last_name}. Share this OTP with them to activate their account.`,
            // Return the OTP in response so Admin can copy and share it
            otp,
            user_email: user.email,
            user_role: user.role
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ============================================================
// GET /api/admin/all-users
// Admin sees all users (filter by role: ?role=Doctor)
// ============================================================
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;

        let query = 'SELECT id, first_name, last_name, email, phone, role, isVerified, isDeleted, created_at FROM users WHERE 1=1';
        const params = [];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await db.query(query, params);
        res.status(200).json({ success: true, total: users.length, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// DELETE /api/admin/delete-user/:id
// Admin soft-deletes ANY user (Patient, Doctor, or Nurse)
// ============================================================
exports.softDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userModel.findUserById(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found or already deleted.' });

        if (Number(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own Admin account.' });
        }

        await userModel.softDeleteUser(id);

        res.status(200).json({ success: true, message: `${user.role} account (${user.email}) has been soft-deleted.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

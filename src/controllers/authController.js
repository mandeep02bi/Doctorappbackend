const authService = require('../services/auth.service');

// ─────────────────────────────────────────────────────
// POST /api/auth/setup-admin
// One-time endpoint to create the first Admin account.
// After this, check the DB for the 10-digit OTP.
// ─────────────────────────────────────────────────────
exports.setupAdmin = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'first_name, last_name, email, and password are required.' });
        }

        const { adminId, otp } = await authService.registerAdmin(req.body);

        res.status(201).json({
            success: true,
            message:
                'Admin account created. A 10-digit OTP has been saved in your database (users table).' +
                ' Use POST /api/auth/verify-admin with your email and that OTP to activate your account.',
            // We return it here too so you can see it during initial setup
            debug_otp: otp,
            adminId
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/verify-admin
// Admin reads the 10-digit OTP from the DB and submits here.
// Account is activated and Admin can login.
// ─────────────────────────────────────────────────────
exports.verifyAdmin = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'email and otp are required.' });
        }

        await authService.verifyAdminAccount(email, otp);

        res.status(200).json({
            success: true,
            message: 'Admin account verified successfully! You can now login using POST /api/auth/login.'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/register
// Doctor & Nurse register their own account.
// An OTP is generated, stored in DB, and emailed to Admin.
// Admin then shares this OTP with the Doctor/Nurse.
// ─────────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, password, role } = req.body;

        if (!first_name || !last_name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        await authService.registerDoctorOrNurse(req.body);

        res.status(201).json({
            success: true,
            message:
                `Registration successful! Your account will be activated once an Admin approves it.\n` +
                `Admin will send you an OTP to activate your account.`
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/verify-account
// Doctor/Nurse enter the OTP received from Admin to activate.
// ─────────────────────────────────────────────────────
exports.verifyAccount = async (req, res) => {
    try {
        const { email, otp, role } = req.body;

        if (!email || !otp || !role) {
            return res.status(400).json({ success: false, message: 'email, otp, and role are required.' });
        }

        await authService.verifyDoctorOrNurseAccount(email, otp, role);

        res.status(200).json({
            success: true,
            message: 'Account activated successfully! You can now login using POST /api/auth/login.'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/login
// All roles login — returns JWT token.
// ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
        }

        const { token, user } = await authService.login(email, password, role);

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id:         user.id,
                first_name: user.first_name,
                last_name:  user.last_name,
                email:      user.email,
                role:       user.role
            }
        });
    } catch (err) {
        res.status(401).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Send password reset OTP to user's own email.
// ─────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

        await authService.sendOTP(email);

        res.status(200).json({ success: true, message: 'OTP sent to your email address.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Verify OTP and set new password.
// ─────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'email, otp, and newPassword are all required.' });
        }

        await authService.resetPassword(email, otp, newPassword);

        res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/change-password  [PROTECTED]
// Logged-in user changes their password.
// ─────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required.' });
        }

        await authService.changePassword(req.user.id, currentPassword, newPassword);

        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

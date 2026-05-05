const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const userModel = require('../models/userModel');
const { generateOTP, generate10DigitOTP } = require('../utils/otpGenerator');
const sendEmail = require('../utils/emailSender');

// ═══════════════════════════════════════════════════════
// ADMIN SETUP (one-time only)
// Step 1: Admin registers → 10-digit OTP saved in DB
// Step 2: Admin reads OTP from DB → verifies account → can login
// ═══════════════════════════════════════════════════════

exports.registerAdmin = async (userData) => {
    const { first_name, last_name, email, phone, password } = userData;

    // Check if any Admin already exists (only one Admin setup allowed)
    const [existing] = await db.query(
        "SELECT id FROM users WHERE role = 'Admin' LIMIT 1"
    );
    if (existing.length) {
        throw new Error('An Admin account already exists. Contact your system administrator.');
    }

    // Check email not already taken
    const existingEmail = await userModel.findUserByEmail(email);
    if (existingEmail) throw new Error('This email is already registered.');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 10-digit OTP — this will be visible in the DB
    const otp = generate10DigitOTP();
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour window

    // Create Admin account — isVerified = false until OTP is entered
    const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, isVerified, otp, otp_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, phone || null, hashedPassword, 'Admin', false, otp, otpExpiry]
    );

    // Return the OTP so you can see it (also visible directly in the DB)
    return { adminId: result.insertId, otp };
};

exports.verifyAdminAccount = async (email, otp) => {
    const user = await userModel.findUserByEmail(email);

    if (!user || user.role !== 'Admin') {
        throw new Error('Admin account not found.');
    }
    if (user.isVerified) {
        throw new Error('Admin account is already verified. Please login.');
    }
    if (user.otp !== otp) {
        throw new Error('Incorrect OTP. Please check your database and try again.');
    }
    if (new Date() > new Date(user.otp_expiry)) {
        throw new Error('OTP has expired. Please re-register the admin account.');
    }

    // Mark Admin as verified and clear OTP
    await db.query(
        'UPDATE users SET isVerified = true, otp = NULL, otp_expiry = NULL WHERE id = ?',
        [user.id]
    );
};

// ═══════════════════════════════════════════════════════
// DOCTOR & NURSE REGISTRATION
// On register: generates OTP, saves it in DB, EMAILS to Admin
// Doctor/Nurse enter that OTP to verify their account
// ═══════════════════════════════════════════════════════

exports.registerDoctorOrNurse = async (userData) => {
    const { first_name, last_name, email, phone, password, role } = userData;

    if (!['Doctor', 'Nurse'].includes(role)) {
        throw new Error('Registration is only allowed for Doctor or Nurse roles.');
    }

    const existing = await userModel.findUserByEmail(email);
    if (existing) throw new Error('An account with this email already exists.');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a 4-digit activation OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48-hour window for admin

    // Create user — isVerified = false until OTP verified
    const [result] = await db.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, isVerified, otp, otp_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, phone || null, hashedPassword, role, false, otp, otpExpiry]
    );

    // Find the Admin email to send the notification
    const [admins] = await db.query(
        "SELECT email, first_name FROM users WHERE role = 'Admin' AND isVerified = true AND isDeleted = false LIMIT 1"
    );

    if (admins.length) {
        try {
            await sendEmail({
                email: admins[0].email,
                subject: `New ${role} Account Approval Required — Medical App`,
                message:
                    `Hello ${admins[0].first_name},\n\n` +
                    `A new ${role} has registered and is awaiting account activation.\n\n` +
                    `👤 Name:  ${first_name} ${last_name}\n` +
                    `📧 Email: ${email}\n\n` +
                    `🔑 Activation OTP: ${otp}\n\n` +
                    `Please share this OTP with the ${role} to activate their account.\n` +
                    `(OTP is valid for 48 hours)\n\n` +
                    `— Medical App System`
            });
        } catch (emailErr) {
            console.error('Failed to email Admin — OTP is still stored in DB:', emailErr.message);
        }
    }

    return result.insertId;
};

// ═══════════════════════════════════════════════════════
// VERIFY ACCOUNT — Doctor/Nurse enter OTP given by Admin
// ═══════════════════════════════════════════════════════

exports.verifyDoctorOrNurseAccount = async (email, otp, role) => {
    const user = await userModel.findUserByEmail(email);

    if (!user) throw new Error('No account found with this email.');
    if (user.role !== role) {
        throw new Error(`Role mismatch. This account is registered as ${user.role}, not ${role}.`);
    }
    if (!['Doctor', 'Nurse'].includes(user.role)) {
        throw new Error('This endpoint is only for Doctor and Nurse verification.');
    }
    if (user.isVerified) {
        throw new Error('Your account is already verified. Please login.');
    }
    if (user.otp !== otp) {
        throw new Error('Incorrect OTP. Please get the correct OTP from Admin.');
    }
    if (new Date() > new Date(user.otp_expiry)) {
        throw new Error('OTP has expired. Please contact Admin to issue a new OTP.');
    }

    // Activate account
    await db.query(
        'UPDATE users SET isVerified = true, otp = NULL, otp_expiry = NULL WHERE id = ?',
        [user.id]
    );
};

// ═══════════════════════════════════════════════════════
// ADMIN: Resend OTP to Doctor/Nurse (if expired or lost)
// ═══════════════════════════════════════════════════════

exports.resendActivationOTP = async (targetEmail) => {
    const user = await userModel.findUserByEmail(targetEmail);

    if (!user) throw new Error('No account found with this email.');
    if (user.isVerified) throw new Error('Account is already verified.');
    if (!['Doctor', 'Nurse'].includes(user.role)) {
        throw new Error('Can only resend OTP for Doctor or Nurse accounts.');
    }

    const newOtp = generateOTP();
    const newExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await db.query(
        'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?',
        [newOtp, newExpiry, user.id]
    );

    return { otp: newOtp, user };
};

// ═══════════════════════════════════════════════════════
// LOGIN — All roles (Admin, Doctor, Nurse, Patient)
// ═══════════════════════════════════════════════════════

exports.login = async (email, password, role) => {
    const user = await userModel.findUserByEmail(email);
    if (!user) throw new Error('Invalid email or password.');

    if (user.role !== role) {
        throw new Error(`Role mismatch. Please select the correct role for this account.`);
    }

    // Block unverified accounts from logging in
    if (!user.isVerified) {
        if (user.role === 'Admin') {
            throw new Error('Admin account not verified. Please complete OTP verification.');
        }
        throw new Error('Your account is not yet activated. Please enter the OTP provided by Admin.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password.');

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return { token, user };
};

// ═══════════════════════════════════════════════════════
// FORGOT PASSWORD — Step 1: Send OTP to user's email
// ═══════════════════════════════════════════════════════

exports.sendOTP = async (email) => {
    const user = await userModel.findUserByEmail(email);
    if (!user) throw new Error('No account found with this email address.');

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userModel.updateUserOTP(user.id, otp, expiry);

    await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP — Medical App',
        message:
            `Hello ${user.first_name},\n\n` +
            `Your OTP to reset your password is:\n\n  🔑 ${otp}\n\n` +
            `This OTP is valid for 10 minutes only.\n\n— Medical App Team`
    });
};

// ═══════════════════════════════════════════════════════
// FORGOT PASSWORD — Step 2: Verify OTP & set new password
// ═══════════════════════════════════════════════════════

exports.resetPassword = async (email, otp, newPassword) => {
    const user = await userModel.findUserByEmail(email);
    if (!user) throw new Error('No account found with this email address.');

    if (user.otp !== otp) throw new Error('Incorrect OTP. Please try again.');
    if (new Date() > new Date(user.otp_expiry)) {
        throw new Error('OTP has expired. Please request a new one.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(user.id, hashed);
};

// ═══════════════════════════════════════════════════════
// CHANGE PASSWORD — Logged-in user (needs current password)
// ═══════════════════════════════════════════════════════

exports.changePassword = async (userId, currentPassword, newPassword) => {
    const user = await userModel.findUserById(userId);
    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('Current password is incorrect.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, hashed);
};

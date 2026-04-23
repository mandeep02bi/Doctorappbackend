const db = require('../config/db');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const sendEmail = require('../utils/emailSender');
const { generateRandomPassword } = require('../utils/passwordUtils');

// ============================================================
// POST /api/nurse/create-patient
// Only Nurses can call this. It creates a Patient account
// with all 3 steps of data: Personal + Vitals + Address
// ============================================================
exports.createPatient = async (req, res) => {
    try {
        const {
            // Step 1: Personal Info
            first_name, last_name, email, phone, date_of_birth, gender,
            // Step 2: Vitals & Medical History
            blood_group, height_cm, weight_kg, pulse, respiratory_rate,
            allergies, past_medical_history,
            // Step 3: Address
            street_address, city
        } = req.body;

        // Required field validation
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ success: false, message: 'first_name, last_name, and email are required.' });
        }

        // Check for duplicate account
        const existing = await userModel.findUserByEmail(email);
        if (existing) {
            return res.status(400).json({ success: false, message: 'A patient with this email already exists.' });
        }

        // Generate & hash a random 8-char password
        const rawPassword = generateRandomPassword(8);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 1. Create the user account (auto-verified because Nurse creates it)
        const newPatientId = await userModel.createUser({
            first_name, last_name, email, phone,
            password: hashedPassword,
            role: 'Patient',
            isVerified: true
        });

        // 2. Insert full profile into patients_profile
        await db.query(
            `INSERT INTO patients_profile 
                (user_id, created_by_nurse_id, date_of_birth, gender, blood_group, height_cm, weight_kg, pulse, respiratory_rate, allergies, past_medical_history, street_address, city)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newPatientId, req.user.id,
                date_of_birth || null, gender || null,
                blood_group || null, height_cm || null, weight_kg || null,
                pulse || null, respiratory_rate || null,
                allergies || null, past_medical_history || null,
                street_address || null, city || null
            ]
        );

        // 3. Send welcome email with credentials to patient
        try {
            await sendEmail({
                email,
                subject: 'Your Patient Account Has Been Created — Medical App',
                message: `Hello ${first_name} ${last_name},\n\nYour patient account has been created by our medical staff.\n\nHere are your login credentials:\n\n  📧 Email:    ${email}\n  🔑 Password: ${rawPassword}\n\nPlease log in and change your password immediately for security.\n\nWarm regards,\nMedical App Team`
            });
        } catch (emailErr) {
            console.error('Email delivery failed (account still created):', emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: `Patient account created. Login credentials have been sent to ${email}.`
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// POST /api/nurse/book-appointment
// Nurse books an appointment on behalf of a patient to a doctor
// ============================================================
exports.bookAppointmentForPatient = async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, reason } = req.body;

        if (!patient_id || !doctor_id || !appointment_date) {
            return res.status(400).json({ success: false, message: 'patient_id, doctor_id, and appointment_date are required.' });
        }

        // Verify patient exists and is a Patient
        const [patientCheck] = await db.query(
            "SELECT id FROM users WHERE id = ? AND role = 'Patient' AND isDeleted = false",
            [patient_id]
        );
        if (!patientCheck.length) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        // Verify doctor exists and is verified
        const [doctorCheck] = await db.query(
            "SELECT id FROM users WHERE id = ? AND role = 'Doctor' AND isVerified = true AND isDeleted = false",
            [doctor_id]
        );
        if (!doctorCheck.length) {
            return res.status(404).json({ success: false, message: 'Doctor not found or not verified.' });
        }

        const [result] = await db.query(
            'INSERT INTO appointments (patient_id, doctor_id, booked_by, appointment_date, reason) VALUES (?, ?, ?, ?, ?)',
            [patient_id, doctor_id, req.user.id, appointment_date, reason || null]
        );

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully.',
            appointment_id: result.insertId
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// GET /api/nurse/my-profile
// Nurse views their own profile
// ============================================================
exports.getMyProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.isVerified, n.specialty, n.experience
             FROM users u
             LEFT JOIN nurses_profile n ON u.id = n.user_id
             WHERE u.id = ? AND u.isDeleted = false`,
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found.' });
        res.status(200).json({ success: true, profile: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// PUT /api/nurse/my-profile
// Nurse updates their own profile
// ============================================================
exports.updateMyProfile = async (req, res) => {
    try {
        const { phone, specialty, experience } = req.body;
        const nurseId = req.user.id;

        // Update phone in users table
        if (phone) {
            await db.query('UPDATE users SET phone = ? WHERE id = ?', [phone, nurseId]);
        }

        // Upsert nurses_profile
        await db.query(
            `INSERT INTO nurses_profile (user_id, specialty, experience) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE specialty = VALUES(specialty), experience = VALUES(experience)`,
            [nurseId, specialty || null, experience || null]
        );

        res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// DELETE /api/nurse/delete-my-account
// Nurse soft-deletes their own account
// ============================================================
exports.deleteSelf = async (req, res) => {
    try {
        await userModel.softDeleteUser(req.user.id);
        res.status(200).json({ success: true, message: 'Your account has been deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

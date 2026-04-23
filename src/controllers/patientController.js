const db = require('../config/db');
const userModel = require('../models/userModel');

// ============================================================
// GET /api/patients/my-profile
// Patient sees their own full record (personal + vitals + address)
// ============================================================
exports.getMyProfile = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [rows] = await db.query(
            `SELECT 
                u.id, u.first_name, u.last_name, u.email, u.phone,
                p.date_of_birth, p.gender,
                p.blood_group, p.height_cm, p.weight_kg, p.pulse, p.respiratory_rate,
                p.allergies, p.past_medical_history,
                p.street_address, p.city
             FROM users u
             LEFT JOIN patients_profile p ON u.id = p.user_id
             WHERE u.id = ? AND u.isDeleted = false`,
            [patientId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Profile not found.' });
        }

        res.status(200).json({ success: true, profile: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// PUT /api/patients/update-profile
// Patient can update their own record (Personal, Medical, Address)
// But CANNOT create anything new — only updates existing profile
// ============================================================
exports.updateMyProfile = async (req, res) => {
    try {
        const patientId = req.user.id;
        const {
            phone,
            date_of_birth, gender,
            blood_group, height_cm, weight_kg, pulse, respiratory_rate,
            allergies, past_medical_history,
            street_address, city
        } = req.body;

        // Update phone in users table if provided
        if (phone) {
            await db.query('UPDATE users SET phone = ? WHERE id = ?', [phone, patientId]);
        }

        // Update medical profile (profile was already created by Nurse)
        await db.query(
            `UPDATE patients_profile SET
                date_of_birth = COALESCE(?, date_of_birth),
                gender = COALESCE(?, gender),
                blood_group = COALESCE(?, blood_group),
                height_cm = COALESCE(?, height_cm),
                weight_kg = COALESCE(?, weight_kg),
                pulse = COALESCE(?, pulse),
                respiratory_rate = COALESCE(?, respiratory_rate),
                allergies = COALESCE(?, allergies),
                past_medical_history = COALESCE(?, past_medical_history),
                street_address = COALESCE(?, street_address),
                city = COALESCE(?, city)
             WHERE user_id = ?`,
            [
                date_of_birth || null, gender || null,
                blood_group || null, height_cm || null, weight_kg || null,
                pulse || null, respiratory_rate || null,
                allergies || null, past_medical_history || null,
                street_address || null, city || null,
                patientId
            ]
        );

        res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// GET /api/patients/my-appointments
// Patient sees their own appointment history
// Doctors shown: ONLY doctors who have an appointment with THIS patient
// ============================================================
exports.getMyAppointments = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [appointments] = await db.query(
            `SELECT 
                a.id, a.appointment_date, a.status, a.reason,
                u.first_name AS doctor_first_name,
                u.last_name  AS doctor_last_name,
                u.email      AS doctor_email
             FROM appointments a
             JOIN users u ON a.doctor_id = u.id
             WHERE a.patient_id = ? AND a.isDeleted = false
             ORDER BY a.appointment_date DESC`,
            [patientId]
        );

        res.status(200).json({ success: true, appointments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// GET /api/patients/available-doctors
// Patient sees ONLY the doctors assigned to them (via appointments)
// NOT all doctors — "only those doctor show that Patient that have appointment for you"
// ============================================================
exports.getMyDoctors = async (req, res) => {
    try {
        const patientId = req.user.id;

        const [doctors] = await db.query(
            `SELECT DISTINCT
                u.id, u.first_name, u.last_name, u.email, u.phone,
                dp.specialty, dp.experience
             FROM appointments a
             JOIN users u  ON a.doctor_id = u.id
             LEFT JOIN doctors_profile dp ON u.id = dp.user_id
             WHERE a.patient_id = ? AND u.isDeleted = false`,
            [patientId]
        );

        res.status(200).json({ success: true, doctors });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// POST /api/patients/book-appointment
// Patient books appointment with ONE of their assigned doctors
// ============================================================
exports.bookAppointment = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { doctor_id, appointment_date, reason } = req.body;

        if (!doctor_id || !appointment_date) {
            return res.status(400).json({ success: false, message: 'doctor_id and appointment_date are required.' });
        }

        // Crucial check: patient can only book with a doctor already assigned to them
        const [existingRelation] = await db.query(
            `SELECT id FROM appointments 
             WHERE patient_id = ? AND doctor_id = ? AND isDeleted = false LIMIT 1`,
            [patientId, doctor_id]
        );

        if (!existingRelation.length) {
            return res.status(403).json({ success: false, message: 'You can only book with doctors assigned to you.' });
        }

        const [result] = await db.query(
            'INSERT INTO appointments (patient_id, doctor_id, booked_by, appointment_date, reason) VALUES (?, ?, ?, ?, ?)',
            [patientId, doctor_id, patientId, appointment_date, reason || null]
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
// DELETE /api/patients/delete-my-account
// Patient soft-deletes their own account
// ============================================================
exports.deleteSelf = async (req, res) => {
    try {
        await userModel.softDeleteUser(req.user.id);
        res.status(200).json({ success: true, message: 'Your account has been deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

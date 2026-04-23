const db = require('../config/db');
const userModel = require('../models/userModel');

// ============================================================
// GET /api/doctors/my-profile
// Doctor views their own profile + specialty
// ============================================================
exports.getMyProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.isVerified,
                    dp.specialty, dp.experience
             FROM users u
             LEFT JOIN doctors_profile dp ON u.id = dp.user_id
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
// PUT /api/doctors/my-profile
// Doctor updates their own profile
// ============================================================
exports.updateMyProfile = async (req, res) => {
    try {
        const { phone, specialty, experience } = req.body;
        const doctorId = req.user.id;

        if (phone) {
            await db.query('UPDATE users SET phone = ? WHERE id = ?', [phone, doctorId]);
        }

        // Upsert doctors_profile (creates row if not exists, updates if exists)
        await db.query(
            `INSERT INTO doctors_profile (user_id, specialty, experience) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE specialty = VALUES(specialty), experience = VALUES(experience)`,
            [doctorId, specialty || null, experience || null]
        );

        res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// GET /api/doctors/my-patients
// Doctor sees ONLY the patients who have an appointment with them
// (Patients without any appointment with this doctor are NOT shown)
// ============================================================
exports.getMyPatients = async (req, res) => {
    try {
        const [patients] = await db.query(
            `SELECT DISTINCT
                u.id, u.first_name, u.last_name, u.email, u.phone,
                p.date_of_birth, p.gender, p.blood_group
             FROM appointments a
             JOIN users u ON a.patient_id = u.id
             LEFT JOIN patients_profile p ON u.id = p.user_id
             WHERE a.doctor_id = ? AND a.isDeleted = false AND u.isDeleted = false
             ORDER BY u.first_name`,
            [req.user.id]
        );
        res.status(200).json({ success: true, patients });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// GET /api/doctors/my-appointments
// Doctor sees all their scheduled appointments
// ============================================================
exports.getMyAppointments = async (req, res) => {
    try {
        const [appointments] = await db.query(
            `SELECT 
                a.id, a.appointment_date, a.status, a.reason,
                u.first_name AS patient_first_name,
                u.last_name  AS patient_last_name,
                u.email      AS patient_email
             FROM appointments a
             JOIN users u ON a.patient_id = u.id
             WHERE a.doctor_id = ? AND a.isDeleted = false
             ORDER BY a.appointment_date DESC`,
            [req.user.id]
        );
        res.status(200).json({ success: true, appointments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// GET /api/doctors/patient/:patientId
// Doctor views a specific patient's full medical record
// Only allowed if that patient has an appointment with this doctor
// ============================================================
exports.getPatientDetail = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { patientId } = req.params;

        // Confirm relationship exists
        const [check] = await db.query(
            'SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? AND isDeleted = false LIMIT 1',
            [doctorId, patientId]
        );
        if (!check.length) {
            return res.status(403).json({ success: false, message: 'Access denied. This patient is not assigned to you.' });
        }

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

        res.status(200).json({ success: true, patient: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// PUT /api/doctors/patient/:patientId
// Doctor updates a patient's medical fields (originally created by Nurse)
// Only allowed for their assigned patients
// ============================================================
exports.updatePatientProfile = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { patientId } = req.params;

        // Confirm doctor-patient relationship
        const [check] = await db.query(
            'SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? AND isDeleted = false LIMIT 1',
            [doctorId, patientId]
        );
        if (!check.length) {
            return res.status(403).json({ success: false, message: 'Access denied. This patient is not assigned to you.' });
        }

        const {
            blood_group, height_cm, weight_kg, pulse, respiratory_rate,
            allergies, past_medical_history, street_address, city
        } = req.body;

        // Update patients_profile (doctor updates medical details only)
        await db.query(
            `UPDATE patients_profile SET
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
                blood_group || null, height_cm || null, weight_kg || null,
                pulse || null, respiratory_rate || null,
                allergies || null, past_medical_history || null,
                street_address || null, city || null,
                patientId
            ]
        );

        res.status(200).json({ success: true, message: 'Patient medical record updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// POST /api/doctors/prescribe/:patientId
// Doctor writes a prescription for a patient
// ============================================================
exports.createPrescription = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { patientId } = req.params;
        const { notes, medicines } = req.body;

        // Confirm doctor-patient relationship
        const [check] = await db.query(
            'SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? AND isDeleted = false LIMIT 1',
            [doctorId, patientId]
        );
        if (!check.length) {
            return res.status(403).json({ success: false, message: 'You can only prescribe to your own patients.' });
        }

        const [result] = await db.query(
            'INSERT INTO prescriptions (patient_id, doctor_id, notes, medicines) VALUES (?, ?, ?, ?)',
            [patientId, doctorId, notes || null, medicines || null]
        );

        res.status(201).json({ success: true, message: 'Prescription created.', prescription_id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// PUT /api/doctors/appointment/:appointmentId/status
// Doctor updates appointment status (Confirmed / Completed / Cancelled)
// ============================================================
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;
        const allowed = ['Confirmed', 'Completed', 'Cancelled'];

        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
        }

        await db.query(
            'UPDATE appointments SET status = ? WHERE id = ? AND doctor_id = ?',
            [status, appointmentId, req.user.id]
        );

        res.status(200).json({ success: true, message: `Appointment marked as ${status}.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ============================================================
// DELETE /api/doctors/delete-my-account
// Doctor soft-deletes their own account
// ============================================================
exports.deleteSelf = async (req, res) => {
    try {
        await userModel.softDeleteUser(req.user.id);
        res.status(200).json({ success: true, message: 'Your account has been deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

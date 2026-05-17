const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// GET /api/doctors — list all doctors
const getAllDoctors = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT u.id, u.user_code, u.first_name, u.last_name, u.email, u.phone,
                dp.specialty, dp.experience, dp.qualification, dp.profile_photo
         FROM users u
         LEFT JOIN doctors_profile dp ON dp.user_id = u.id
         WHERE u.role = 'Doctor' AND u.isDeleted = false
         ORDER BY u.first_name ASC`
    );

    return success(res, 200, 'Doctors fetched', rows);
});

// GET /api/doctors/profile — doctor views own extended profile
const getMyProfile = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT u.id, u.user_code, u.first_name, u.last_name, u.email, u.phone,
                u.last_login_at, u.created_at,
                dp.specialty, dp.experience, dp.qualification, dp.profile_photo, dp.updated_at
         FROM users u
         LEFT JOIN doctors_profile dp ON dp.user_id = u.id
         WHERE u.id = ? AND u.isDeleted = false`,
        [req.user.id]
    );

    if (rows.length === 0) {
        return error(res, 404, 'User not found');
    }

    return success(res, 200, 'Profile fetched', rows[0]);
});

// POST /api/doctors/profile — doctor creates extended profile (first time)
const createProfile = asyncHandler(async (req, res) => {
    const { specialty, experience, qualification, profile_photo } = req.body;

    // Check if profile already exists
    const [existing] = await pool.query(
        'SELECT id FROM doctors_profile WHERE user_id = ?',
        [req.user.id]
    );

    if (existing.length > 0) {
        return error(res, 409, 'Profile already exists, use PUT to update');
    }

    const [result] = await pool.query(
        `INSERT INTO doctors_profile (user_id, specialty, experience, qualification, profile_photo)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, specialty || null, experience || null, qualification || null, profile_photo || null]
    );

    return success(res, 201, 'Profile created', { id: result.insertId });
});

// PUT /api/doctors/profile — doctor updates extended profile
const updateProfile = asyncHandler(async (req, res) => {
    const { specialty, experience, qualification, profile_photo } = req.body;

    const [existing] = await pool.query(
        'SELECT id FROM doctors_profile WHERE user_id = ?',
        [req.user.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Profile not found, use POST to create first');
    }

    await pool.query(
        `UPDATE doctors_profile SET specialty = ?, experience = ?, qualification = ?, profile_photo = ?
         WHERE user_id = ?`,
        [specialty || null, experience || null, qualification || null, profile_photo || null, req.user.id]
    );

    return success(res, 200, 'Profile updated');
});

module.exports = { getAllDoctors, getMyProfile, createProfile, updateProfile };
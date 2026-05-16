const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// POST /api/reminders
const createReminder = asyncHandler(async (req, res) => {
    const { patient_id, title, description, remind_at } = req.body;

    // Verify patient exists
    const [patient] = await pool.query('SELECT id FROM patients WHERE id = ? AND isDeleted = false', [patient_id]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    const [result] = await pool.query(
        'INSERT INTO reminders (patient_id, created_by, title, description, remind_at) VALUES (?, ?, ?, ?, ?)',
        [patient_id, req.user.id, title, description || null, remind_at]
    );

    return success(res, 201, 'Reminder created', { id: result.insertId });
});

// GET /api/reminders
const getAllReminders = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT r.id, r.title, r.description, r.remind_at, r.is_done, r.created_at,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
         FROM reminders r
         INNER JOIN patients p ON p.id = r.patient_id
         INNER JOIN users u ON u.id = r.created_by
         WHERE r.isDeleted = false
         ORDER BY r.remind_at ASC`
    );

    return success(res, 200, 'Reminders fetched', rows);
});

// PUT /api/reminders/:id
const updateReminder = asyncHandler(async (req, res) => {
    const { title, description, remind_at, is_done } = req.body;

    const [existing] = await pool.query(
        'SELECT id FROM reminders WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Reminder not found');
    }

    await pool.query(
        'UPDATE reminders SET title = ?, description = ?, remind_at = ?, is_done = ? WHERE id = ?',
        [title, description || null, remind_at, is_done || false, req.params.id]
    );

    return success(res, 200, 'Reminder updated');
});

// DELETE /api/reminders/:id
const deleteReminder = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM reminders WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Reminder not found');
    }

    await pool.query('UPDATE reminders SET isDeleted = true WHERE id = ?', [req.params.id]);

    return success(res, 200, 'Reminder deleted');
});

module.exports = { createReminder, getAllReminders, updateReminder, deleteReminder };

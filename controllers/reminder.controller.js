const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

const createReminder = asyncHandler(async (req, res) => {
    const { patient_code, reminder_type, title, description, payment_link, start_date, end_date } = req.body;
    if (!patient_code || !title) return error(res, 400, 'Patient code and title are required');

    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [patient_code]);
    if (patient.length === 0) return error(res, 404, 'Patient not found');

    const [result] = await pool.query(
        'INSERT INTO reminders (patient_id, created_by, reminder_type, title, description, payment_link, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [patient[0].id, req.user.id, reminder_type || 'Reminder', title, description || null, payment_link || null, start_date || null, end_date || null]
    );
    return success(res, 201, 'Reminder created', { id: result.insertId });
});

const getAllReminders = asyncHandler(async (req, res) => {
    const { patient_code, reminder_type } = req.query;
    let query = `SELECT r.id, r.reminder_type, r.title, r.description, r.payment_link, r.start_date, r.end_date, r.is_done, r.created_at,
        CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name, p.patient_code,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
        FROM reminders r INNER JOIN patients p ON p.id = r.patient_id INNER JOIN users u ON u.id = r.created_by WHERE r.isDeleted = false`;
    const params = [];
    if (patient_code) { query += ' AND p.patient_code = ?'; params.push(patient_code); }
    if (reminder_type) { query += ' AND r.reminder_type = ?'; params.push(reminder_type); }
    query += ' ORDER BY r.created_at DESC';
    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Reminders fetched', rows);
});

const updateReminder = asyncHandler(async (req, res) => {
    const { title, description, payment_link, start_date, end_date, is_done } = req.body;
    await pool.query('UPDATE reminders SET title = COALESCE(?, title), description = COALESCE(?, description), payment_link = COALESCE(?, payment_link), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), is_done = COALESCE(?, is_done) WHERE id = ? AND isDeleted = false',
        [title, description, payment_link, start_date, end_date, is_done, req.params.id]);
    return success(res, 200, 'Reminder updated');
});

const deleteReminder = asyncHandler(async (req, res) => {
    await pool.query('UPDATE reminders SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Reminder deleted');
});

module.exports = { createReminder, getAllReminders, updateReminder, deleteReminder };

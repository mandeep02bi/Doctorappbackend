const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

const createInstruction = asyncHandler(async (req, res) => {
    const { patient_code, title, description, instruction_date } = req.body;
    if (!patient_code || !title || !description) return error(res, 400, 'Patient code, title and description are required');

    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [patient_code]);
    if (patient.length === 0) return error(res, 404, 'Patient not found');

    const [result] = await pool.query('INSERT INTO instructions (patient_id, doctor_id, title, description, instruction_date) VALUES (?, ?, ?, ?, ?)', [patient[0].id, req.user.id, title, description, instruction_date || null]);
    return success(res, 201, 'Instruction created', { id: result.insertId });
});

const getAllInstructions = asyncHandler(async (req, res) => {
    const { patient_code, sort } = req.query;
    let query = `SELECT i.id, i.title, i.description, i.instruction_date, i.created_at,
        CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name, p.patient_code,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM instructions i INNER JOIN patients p ON p.id = i.patient_id INNER JOIN users d ON d.id = i.doctor_id WHERE i.isDeleted = false`;
    const params = [];
    if (req.user.role === 'Doctor') { query += ' AND i.doctor_id = ?'; params.push(req.user.id); }
    if (patient_code) { query += ' AND p.patient_code = ?'; params.push(patient_code); }
    query += sort === 'oldest' ? ' ORDER BY i.created_at ASC' : ' ORDER BY i.created_at DESC';
    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Instructions fetched', rows);
});

const getInstruction = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`SELECT i.*, CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name, p.patient_code, p.gender, p.age,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM instructions i INNER JOIN patients p ON p.id = i.patient_id INNER JOIN users d ON d.id = i.doctor_id WHERE i.id = ? AND i.isDeleted = false`, [req.params.id]);
    if (rows.length === 0) return error(res, 404, 'Instruction not found');
    const inst = rows[0]; delete inst.isDeleted;
    return success(res, 200, 'Instruction fetched', inst);
});

const updateInstruction = asyncHandler(async (req, res) => {
    const { title, description, instruction_date } = req.body;
    await pool.query('UPDATE instructions SET title = ?, description = ?, instruction_date = ? WHERE id = ? AND isDeleted = false', [title, description, instruction_date || null, req.params.id]);
    return success(res, 200, 'Instruction updated');
});

const deleteInstruction = asyncHandler(async (req, res) => {
    await pool.query('UPDATE instructions SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Instruction deleted');
});

module.exports = { createInstruction, getAllInstructions, getInstruction, updateInstruction, deleteInstruction };

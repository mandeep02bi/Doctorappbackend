const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

const createTemplate = asyncHandler(async (req, res) => {
    const { type, title, content, doctor_code } = req.body;
    if (!type || !title || !content) return error(res, 400, 'Type, title and content are required');
    const valid = ['Medicine', 'Lab Test', 'Instruction', 'Certificate'];
    if (!valid.includes(type)) return error(res, 400, 'Type must be Medicine, Lab Test, Instruction or Certificate');

    // Determine creator
    let createdBy = req.user.id;
    if (doctor_code && req.user.role === 'Admin') {
        const [doc] = await pool.query("SELECT id FROM users WHERE user_code = ? AND role = 'Doctor' AND isDeleted = false", [doctor_code]);
        if (doc.length === 0) return error(res, 404, 'Doctor not found');
        createdBy = doc[0].id;
    }

    const [result] = await pool.query('INSERT INTO templates (created_by, type, title, content) VALUES (?, ?, ?, ?)', [createdBy, type, title, content]);
    return success(res, 201, 'Template created', { id: result.insertId });
});

const getAllTemplates = asyncHandler(async (req, res) => {
    const { type } = req.query;
    let query = `SELECT t.id, t.type, t.title, t.content, t.created_at,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by_name, u.user_code AS doctor_code
        FROM templates t INNER JOIN users u ON u.id = t.created_by WHERE t.isDeleted = false`;
    const params = [];

    if (req.user.role === 'Doctor') {
        query += ' AND t.created_by = ?';
        params.push(req.user.id);
    }

    if (type) { query += ' AND t.type = ?'; params.push(type); }
    query += ' ORDER BY t.created_at DESC';
    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Templates fetched', rows);
});

const getTemplate = asyncHandler(async (req, res) => {
    let query = `SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) AS created_by_name, u.user_code AS doctor_code
        FROM templates t INNER JOIN users u ON u.id = t.created_by WHERE t.id = ? AND t.isDeleted = false`;
    const params = [req.params.id];

    if (req.user.role === 'Doctor') {
        query += ' AND t.created_by = ?';
        params.push(req.user.id);
    }

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return error(res, 404, 'Template not found');
    const tmpl = rows[0]; delete tmpl.isDeleted;
    return success(res, 200, 'Template fetched', tmpl);
});

const searchTemplates = asyncHandler(async (req, res) => {
    const { type, q } = req.query;
    if (!q) return success(res, 200, 'Search results', []);
    let query = 'SELECT id, type, title FROM templates WHERE isDeleted = false AND title LIKE ?';
    const params = [`%${q}%`];

    if (req.user.role === 'Doctor') {
        query += ' AND created_by = ?';
        params.push(req.user.id);
    }

    if (type) { query += ' AND type = ?'; params.push(type); }
    query += ' ORDER BY title ASC LIMIT 20';
    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Search results', rows);
});

const updateTemplate = asyncHandler(async (req, res) => {
    const { type, title, content } = req.body;
    await pool.query('UPDATE templates SET type = ?, title = ?, content = ? WHERE id = ? AND isDeleted = false', [type, title, content, req.params.id]);
    return success(res, 200, 'Template updated');
});

const deleteTemplate = asyncHandler(async (req, res) => {
    await pool.query('UPDATE templates SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Template deleted');
});

module.exports = { createTemplate, getAllTemplates, getTemplate, searchTemplates, updateTemplate, deleteTemplate };

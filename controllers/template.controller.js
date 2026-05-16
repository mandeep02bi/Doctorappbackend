const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// POST /api/templates
const createTemplate = asyncHandler(async (req, res) => {
    const { type, title, content } = req.body;

    if (!['Prescription', 'Certificate', 'General'].includes(type)) {
        return error(res, 400, 'Type must be Prescription, Certificate, or General');
    }

    const [result] = await pool.query(
        'INSERT INTO templates (created_by, type, title, content) VALUES (?, ?, ?, ?)',
        [req.user.id, type, title, content]
    );

    return success(res, 201, 'Template created', { id: result.insertId });
});

// GET /api/templates — all doctors can read all templates
const getAllTemplates = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT t.id, t.type, t.title, t.content, t.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name, u.user_code AS doctor_code,
                t.created_by
         FROM templates t
         INNER JOIN users u ON u.id = t.created_by
         WHERE t.isDeleted = false
         ORDER BY t.created_at DESC`
    );

    return success(res, 200, 'Templates fetched', rows);
});

// GET /api/templates/:id
const getTemplateById = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT t.id, t.type, t.title, t.content, t.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name, t.created_by
         FROM templates t
         INNER JOIN users u ON u.id = t.created_by
         WHERE t.id = ? AND t.isDeleted = false`,
        [req.params.id]
    );

    if (rows.length === 0) {
        return error(res, 404, 'Template not found');
    }

    return success(res, 200, 'Template fetched', rows[0]);
});

// PUT /api/templates/:id — ownership middleware ensures only owner can edit
const updateTemplate = asyncHandler(async (req, res) => {
    const { type, title, content } = req.body;

    await pool.query(
        'UPDATE templates SET type = ?, title = ?, content = ? WHERE id = ? AND isDeleted = false',
        [type, title, content, req.params.id]
    );

    return success(res, 200, 'Template updated');
});

// DELETE /api/templates/:id — ownership middleware ensures only owner can delete
const deleteTemplate = asyncHandler(async (req, res) => {
    await pool.query('UPDATE templates SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Template deleted');
});

module.exports = { createTemplate, getAllTemplates, getTemplateById, updateTemplate, deleteTemplate };

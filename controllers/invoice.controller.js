const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// POST /api/invoices
const createInvoice = asyncHandler(async (req, res) => {
    const { patient_id, total_amount, description, notes } = req.body;

    // Verify patient exists
    const [patient] = await pool.query('SELECT id FROM patients WHERE id = ? AND isDeleted = false', [patient_id]);
    if (patient.length === 0) {
        return error(res, 404, 'Patient not found');
    }

    const [result] = await pool.query(
        'INSERT INTO invoices (patient_id, created_by, total_amount, description, notes) VALUES (?, ?, ?, ?, ?)',
        [patient_id, req.user.id, total_amount, description || null, notes || null]
    );

    return success(res, 201, 'Invoice created', { id: result.insertId });
});

// GET /api/invoices
const getAllInvoices = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT i.id, i.total_amount, i.status, i.description, i.created_at,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
         FROM invoices i
         INNER JOIN patients p ON p.id = i.patient_id
         INNER JOIN users u ON u.id = i.created_by
         WHERE i.isDeleted = false
         ORDER BY i.created_at DESC`
    );

    return success(res, 200, 'Invoices fetched', rows);
});

// GET /api/invoices/:id
const getInvoiceById = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT i.id, i.total_amount, i.status, i.description, i.notes, i.created_at, i.updated_at,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
         FROM invoices i
         INNER JOIN patients p ON p.id = i.patient_id
         INNER JOIN users u ON u.id = i.created_by
         WHERE i.id = ? AND i.isDeleted = false`,
        [req.params.id]
    );

    if (rows.length === 0) {
        return error(res, 404, 'Invoice not found');
    }

    return success(res, 200, 'Invoice fetched', rows[0]);
});

// PATCH /api/invoices/:id/status
const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['Unpaid', 'Paid', 'Cancelled'].includes(status)) {
        return error(res, 400, 'Invalid status');
    }

    const [existing] = await pool.query(
        'SELECT id FROM invoices WHERE id = ? AND isDeleted = false',
        [req.params.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Invoice not found');
    }

    await pool.query('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);

    return success(res, 200, 'Invoice status updated');
});

module.exports = { createInvoice, getAllInvoices, getInvoiceById, updateInvoiceStatus };

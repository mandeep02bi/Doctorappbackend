const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// GET /api/search/global?q=
const globalSearch = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return error(res, 400, 'Search query is required');

    const term = `%${q}%`;

    const [results] = await pool.query(
        `SELECT 'patient' AS category, id, CONCAT(first_name, ' ', last_name) COLLATE utf8mb4_general_ci AS label, patient_code COLLATE utf8mb4_general_ci AS detail
         FROM patients WHERE isDeleted = false
           AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR patient_code LIKE ?)
         UNION ALL
         SELECT 'prescription' AS category, id, diagnosis COLLATE utf8mb4_general_ci AS label, notes COLLATE utf8mb4_general_ci AS detail
         FROM prescriptions WHERE isDeleted = false AND diagnosis LIKE ?
         UNION ALL
         SELECT 'invoice' AS category, id, CAST(total_amount AS CHAR) AS label, CAST(status AS CHAR) COLLATE utf8mb4_general_ci AS detail
         FROM invoices WHERE isDeleted = false AND description LIKE ?
         UNION ALL
         SELECT 'record' AS category, id, title COLLATE utf8mb4_general_ci AS label, CAST(file_type AS CHAR) COLLATE utf8mb4_general_ci AS detail
         FROM records WHERE isDeleted = false AND title LIKE ?
         ORDER BY category ASC`,
        [term, term, term, term, term, term, term]
    );

    return success(res, 200, 'Search results', results);
});

// GET /api/search/patients?q=
const searchPatients = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return error(res, 400, 'Search query is required');

    const term = `%${q}%`;

    const [rows] = await pool.query(
        `SELECT id, patient_code, first_name, last_name, email, phone, city
         FROM patients WHERE isDeleted = false
           AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR patient_code LIKE ?)
         ORDER BY first_name ASC`,
        [term, term, term, term, term]
    );

    return success(res, 200, 'Search results', rows);
});

// GET /api/search/prescriptions?q=
const searchPrescriptions = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return error(res, 400, 'Search query is required');

    const term = `%${q}%`;

    let query = `
        SELECT pr.id, pr.diagnosis, pr.notes, pr.created_at,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code
        FROM prescriptions pr
        INNER JOIN patients p ON p.id = pr.patient_id
        WHERE pr.isDeleted = false AND (pr.diagnosis LIKE ? OR pr.notes LIKE ?)`;

    const params = [term, term];

    // Doctor sees only own
    if (req.user.role === 'Doctor') {
        query += ' AND pr.doctor_id = ?';
        params.push(req.user.id);
    }

    query += ' ORDER BY pr.created_at DESC';

    const [rows] = await pool.query(query, params);

    return success(res, 200, 'Search results', rows);
});

// GET /api/search/invoices?q=
const searchInvoices = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return error(res, 400, 'Search query is required');

    // Doctor cannot search invoices
    if (req.user.role === 'Doctor') {
        return error(res, 403, 'Access denied');
    }

    const term = `%${q}%`;

    const [rows] = await pool.query(
        `SELECT i.id, i.total_amount, i.status, i.created_at,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code
         FROM invoices i
         INNER JOIN patients p ON p.id = i.patient_id
         WHERE i.isDeleted = false AND (i.description LIKE ? OR i.notes LIKE ?)
         ORDER BY i.created_at DESC`,
        [term, term]
    );

    return success(res, 200, 'Search results', rows);
});

// GET /api/search/records?q=
const searchRecords = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) return error(res, 400, 'Search query is required');

    const term = `%${q}%`;

    const [rows] = await pool.query(
        `SELECT r.id, r.title, r.file_type, r.created_at,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_code
         FROM records r
         INNER JOIN patients p ON p.id = r.patient_id
         WHERE r.isDeleted = false AND (r.title LIKE ? OR r.file_type LIKE ?)
         ORDER BY r.created_at DESC`,
        [term, term]
    );

    return success(res, 200, 'Search results', rows);
});

module.exports = { globalSearch, searchPatients, searchPrescriptions, searchInvoices, searchRecords };
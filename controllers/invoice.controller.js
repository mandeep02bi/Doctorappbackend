const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// Calculate total: items_total + tax - discount - advance
const calculateTotal = (items, discount_value, discount_type, tax_value, tax_type, advance_amount) => {
    const itemsTotal = items.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    let total = itemsTotal;

    // Add tax
    if (tax_type === 'Percentage') total += itemsTotal * (parseFloat(tax_value || 0) / 100);
    else total += parseFloat(tax_value || 0);

    // Subtract discount
    if (discount_type === 'Percentage') total -= itemsTotal * (parseFloat(discount_value || 0) / 100);
    else total -= parseFloat(discount_value || 0);

    // Subtract advance
    total -= parseFloat(advance_amount || 0);

    return Math.max(0, Math.round(total * 100) / 100);
};

// #61 POST /api/invoices
const createInvoice = asyncHandler(async (req, res) => {
    const { patient_code, bill_to_name, invoice_title, currency, discount_title, discount_value, discount_type, advance_title, advance_amount, tax_title, tax_value, tax_type, remark, invoice_date, status } = req.body;

    if (!patient_code) return error(res, 400, 'Patient code is required');

    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [patient_code]);
    if (patient.length === 0) return error(res, 404, 'Patient not found');

    const [result] = await pool.query(
        `INSERT INTO invoices (patient_id, created_by, bill_to_name, invoice_title, currency, discount_title, discount_value, discount_type, advance_title, advance_amount, tax_title, tax_value, tax_type, remark, invoice_date, status, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [patient[0].id, req.user.id, bill_to_name || null, invoice_title || 'Invoice', currency || 'INR', discount_title || 'Discount', discount_value || 0, discount_type || 'Amount', advance_title || 'Amount Paid', advance_amount || 0, tax_title || 'GST', tax_value || 0, tax_type || 'Percentage', remark || null, invoice_date || null, status || 'To pay']
    );

    return success(res, 201, 'Invoice created', { id: result.insertId });
});

// #62 GET /api/invoices
const getAllInvoices = asyncHandler(async (req, res) => {
    const { patient_code, sort } = req.query;
    let query = `SELECT inv.id, inv.invoice_title, inv.bill_to_name, inv.currency, inv.total_amount, inv.status, inv.invoice_date, inv.created_at,
        CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name, p.patient_code,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
        FROM invoices inv INNER JOIN patients p ON p.id = inv.patient_id INNER JOIN users u ON u.id = inv.created_by WHERE inv.isDeleted = false`;
    const params = [];
    if (patient_code) { query += ' AND p.patient_code = ?'; params.push(patient_code); }
    query += sort === 'oldest' ? ' ORDER BY inv.created_at ASC' : ' ORDER BY inv.created_at DESC';
    const [rows] = await pool.query(query, params);
    return success(res, 200, 'Invoices fetched', rows);
});

// #63 GET /api/invoices/:id
const getInvoice = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`SELECT inv.*,
        CONCAT(p.first_name, ' ', COALESCE(CONCAT(p.middle_name, ' '), ''), p.last_name) AS patient_name, p.patient_code,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
        FROM invoices inv INNER JOIN patients p ON p.id = inv.patient_id INNER JOIN users u ON u.id = inv.created_by
        WHERE inv.id = ? AND inv.isDeleted = false`, [req.params.id]);
    if (rows.length === 0) return error(res, 404, 'Invoice not found');

    const [items] = await pool.query('SELECT id, description, amount FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    const invoice = rows[0]; delete invoice.isDeleted;
    return success(res, 200, 'Invoice fetched', { ...invoice, items });
});

// #64 PUT /api/invoices/:id
const updateInvoice = asyncHandler(async (req, res) => {
    const { bill_to_name, invoice_title, currency, discount_title, discount_value, discount_type, advance_title, advance_amount, tax_title, tax_value, tax_type, remark, invoice_date } = req.body;

    // Recalculate total
    const [items] = await pool.query('SELECT amount FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    const total = calculateTotal(items, discount_value, discount_type, tax_value, tax_type, advance_amount);

    await pool.query(
        `UPDATE invoices SET bill_to_name = ?, invoice_title = ?, currency = ?, discount_title = ?, discount_value = ?, discount_type = ?, advance_title = ?, advance_amount = ?, tax_title = ?, tax_value = ?, tax_type = ?, remark = ?, invoice_date = ?, total_amount = ? WHERE id = ? AND isDeleted = false`,
        [bill_to_name, invoice_title, currency || 'INR', discount_title || 'Discount', discount_value || 0, discount_type || 'Amount', advance_title || 'Amount Paid', advance_amount || 0, tax_title || 'GST', tax_value || 0, tax_type || 'Percentage', remark || null, invoice_date || null, total, req.params.id]
    );
    return success(res, 200, 'Invoice updated');
});

// #65 PATCH /api/invoices/:id/status
const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const valid = ['To pay', 'Paid', 'None'];
    if (!valid.includes(status)) return error(res, 400, 'Invalid status');
    await pool.query('UPDATE invoices SET status = ? WHERE id = ? AND isDeleted = false', [status, req.params.id]);
    return success(res, 200, 'Invoice status updated');
});

// #66 DELETE /api/invoices/:id
const deleteInvoice = asyncHandler(async (req, res) => {
    await pool.query('UPDATE invoices SET isDeleted = true WHERE id = ?', [req.params.id]);
    return success(res, 200, 'Invoice deleted');
});

// Helper: recalculate and update invoice total
const recalcInvoiceTotal = async (invoiceId) => {
    const [inv] = await pool.query('SELECT discount_value, discount_type, tax_value, tax_type, advance_amount FROM invoices WHERE id = ?', [invoiceId]);
    if (inv.length === 0) return;
    const [items] = await pool.query('SELECT amount FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    const total = calculateTotal(items, inv[0].discount_value, inv[0].discount_type, inv[0].tax_value, inv[0].tax_type, inv[0].advance_amount);
    await pool.query('UPDATE invoices SET total_amount = ? WHERE id = ?', [total, invoiceId]);
};

// #67 POST /api/invoices/:id/items
const addItem = asyncHandler(async (req, res) => {
    const { description, amount } = req.body;
    if (!description || amount === undefined) return error(res, 400, 'Description and amount are required');

    const [result] = await pool.query('INSERT INTO invoice_items (invoice_id, description, amount) VALUES (?, ?, ?)', [req.params.id, description, amount]);
    await recalcInvoiceTotal(req.params.id);
    return success(res, 201, 'Item added', { id: result.insertId });
});

// #68 DELETE /api/invoices/:id/items/:itemId
const deleteItem = asyncHandler(async (req, res) => {
    const [item] = await pool.query('SELECT id FROM invoice_items WHERE id = ? AND invoice_id = ?', [req.params.itemId, req.params.id]);
    if (item.length === 0) return error(res, 404, 'Item not found');

    await pool.query('DELETE FROM invoice_items WHERE id = ?', [req.params.itemId]);
    await recalcInvoiceTotal(req.params.id);
    return success(res, 200, 'Item deleted');
});

module.exports = { createInvoice, getAllInvoices, getInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice, addItem, deleteItem };

const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// #69 GET /api/records?patient_code=PT0001&search=fever
const getRecords = asyncHandler(async (req, res) => {
    const { patient_code, search } = req.query;
    if (!patient_code) return error(res, 400, 'patient_code is required');

    const [patient] = await pool.query('SELECT id FROM patients WHERE patient_code = ? AND isDeleted = false', [patient_code]);
    if (patient.length === 0) return error(res, 404, 'Patient not found');
    const pid = patient[0].id;

    const s = search ? `%${search}%` : null;

    // Prescriptions
    let rxQuery = `SELECT pr.id, pr.diagnosis, pr.chief_complaint, pr.prescription_date, pr.created_at,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.user_code AS doctor_code
        FROM prescriptions pr INNER JOIN users d ON d.id = pr.doctor_id WHERE pr.patient_id = ? AND pr.isDeleted = false`;
    const rxParams = [pid];
    if (s) { rxQuery += ' AND (pr.diagnosis LIKE ? OR pr.chief_complaint LIKE ? OR pr.findings LIKE ? OR pr.treatment_advice LIKE ?)'; rxParams.push(s, s, s, s); }
    rxQuery += ' ORDER BY pr.created_at DESC';

    // Certificates
    let certQuery = `SELECT c.id, c.title, c.description, c.certificate_date, c.created_at,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name FROM certificates c INNER JOIN users d ON d.id = c.doctor_id WHERE c.patient_id = ? AND c.isDeleted = false`;
    const certParams = [pid];
    if (s) { certQuery += ' AND (c.title LIKE ? OR c.description LIKE ?)'; certParams.push(s, s); }
    certQuery += ' ORDER BY c.created_at DESC';

    // Instructions
    let instrQuery = `SELECT i.id, i.title, i.description, i.instruction_date, i.created_at,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name FROM instructions i INNER JOIN users d ON d.id = i.doctor_id WHERE i.patient_id = ? AND i.isDeleted = false`;
    const instrParams = [pid];
    if (s) { instrQuery += ' AND (i.title LIKE ? OR i.description LIKE ?)'; instrParams.push(s, s); }
    instrQuery += ' ORDER BY i.created_at DESC';

    // Consents
    let consentQuery = `SELECT c.id, c.title, c.description, c.consent_date, c.created_at,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name FROM consents c INNER JOIN users d ON d.id = c.doctor_id WHERE c.patient_id = ? AND c.isDeleted = false`;
    const consentParams = [pid];
    if (s) { consentQuery += ' AND (c.title LIKE ? OR c.description LIKE ?)'; consentParams.push(s, s); }
    consentQuery += ' ORDER BY c.created_at DESC';

    // Invoices
    let invQuery = `SELECT id, invoice_title, total_amount, status, invoice_date, created_at FROM invoices WHERE patient_id = ? AND isDeleted = false`;
    const invParams = [pid];
    if (s) { invQuery += ' AND (invoice_title LIKE ? OR remark LIKE ?)'; invParams.push(s, s); }
    invQuery += ' ORDER BY created_at DESC';

    // Appointments
    let apptQuery = `SELECT a.id, a.patient_name, a.appointment_date, a.appointment_time, a.purpose, a.status,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name FROM appointments a INNER JOIN users d ON d.id = a.doctor_id WHERE a.patient_id = ? AND a.isDeleted = false`;
    const apptParams = [pid];
    if (s) { apptQuery += ' AND (a.purpose LIKE ? OR a.patient_name LIKE ?)'; apptParams.push(s, s); }
    apptQuery += ' ORDER BY a.created_at DESC';

    // Reminders
    let remQuery = `SELECT id, reminder_type, title, description, start_date, end_date, is_done, created_at FROM reminders WHERE patient_id = ? AND isDeleted = false`;
    const remParams = [pid];
    if (s) { remQuery += ' AND (title LIKE ? OR description LIKE ?)'; remParams.push(s, s); }
    remQuery += ' ORDER BY created_at DESC';

    const [prescriptions] = await pool.query(rxQuery, rxParams);
    const [certificates] = await pool.query(certQuery, certParams);
    const [instructions] = await pool.query(instrQuery, instrParams);
    const [consents] = await pool.query(consentQuery, consentParams);
    const [invoices] = await pool.query(invQuery, invParams);
    const [appointments] = await pool.query(apptQuery, apptParams);
    const [reminders] = await pool.query(remQuery, remParams);

    return success(res, 200, 'Records fetched', { prescriptions, certificates, instructions, consents, invoices, appointments, reminders });
});

module.exports = { getRecords };

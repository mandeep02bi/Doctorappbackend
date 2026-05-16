const pool = require('../config/db');
const { error } = require('../utils/response');

// Usage: ownership('prescriptions', 'doctor_id')
// Checks if the logged-in user is the owner of the resource
const ownership = (table, ownerColumn) => {
    return async (req, res, next) => {
        const resourceId = req.params.id;

        // Admin can access everything
        if (req.user.role === 'Admin') {
            return next();
        }

        const [rows] = await pool.query(
            `SELECT ${ownerColumn} FROM ${table} WHERE id = ? AND isDeleted = false`,
            [resourceId]
        );

        if (rows.length === 0) {
            return error(res, 404, 'Resource not found');
        }

        if (rows[0][ownerColumn] !== req.user.id) {
            return error(res, 403, 'You can only modify your own data');
        }

        next();
    };
};

module.exports = ownership;

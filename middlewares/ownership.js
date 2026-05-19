const pool = require('../config/db');
const { error } = require('../utils/response');

const ownership = (table, ownerColumn) => {
    return async (req, res, next) => {
        if (req.user.role === 'Admin') return next();

        try {
            const [rows] = await pool.query(
                `SELECT ${ownerColumn} FROM ${table} WHERE id = ? AND isDeleted = false`,
                [req.params.id]
            );

            if (rows.length === 0) {
                return error(res, 404, 'Resource not found');
            }

            if (rows[0][ownerColumn] !== req.user.id) {
                return error(res, 403, 'You can only modify your own data');
            }

            next();
        } catch (err) {
            return error(res, 500, 'Server error');
        }
    };
};

module.exports = ownership;

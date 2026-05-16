const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { error } = require('../utils/response');

const auth = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return error(res, 401, 'No token provided');
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await pool.query(
            'SELECT id, first_name, last_name, email, role, user_code FROM users WHERE id = ? AND isDeleted = false',
            [decoded.id]
        );

        if (rows.length === 0) {
            return error(res, 401, 'User not found');
        }

        req.user = rows[0];
        next();
    } catch (err) {
        return error(res, 401, 'Invalid or expired token');
    }
};

module.exports = auth;

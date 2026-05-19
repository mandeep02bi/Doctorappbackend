const pool = require('../config/db');
const { error } = require('../utils/response');

const pdfLimiter = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get or create usage counter
        let [rows] = await pool.query('SELECT * FROM usage_counter WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            await pool.query('INSERT INTO usage_counter (user_id, total_count) VALUES (?, 0)', [userId]);
            [rows] = await pool.query('SELECT * FROM usage_counter WHERE user_id = ?', [userId]);
        }

        const counter = rows[0];

        if (counter.total_count >= counter.max_limit) {
            return error(res, 429, 'PDF conversion limit reached. Please contact admin.');
        }

        // Increment count
        await pool.query('UPDATE usage_counter SET total_count = total_count + 1 WHERE user_id = ?', [userId]);

        next();
    } catch (err) {
        return error(res, 500, 'Server error');
    }
};

module.exports = pdfLimiter;

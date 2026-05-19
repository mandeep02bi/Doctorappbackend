const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return error(res, 401, 'Not authenticated');
    }

    try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, user_code }
        next();
    } catch (err) {
        return error(res, 401, 'Token expired or invalid');
    }
};

module.exports = auth;

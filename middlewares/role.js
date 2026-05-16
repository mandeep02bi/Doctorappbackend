const { error } = require('../utils/response');

// Usage: role('Admin', 'Doctor') → only Admin and Doctor can access
const role = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, 401, 'Not authenticated');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return error(res, 403, 'Access denied');
        }

        next();
    };
};

module.exports = role;

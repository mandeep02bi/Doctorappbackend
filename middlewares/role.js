const { error } = require('../utils/response');

const role = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return error(res, 403, 'Access denied');
        }
        next();
    };
};

module.exports = role;

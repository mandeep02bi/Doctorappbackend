const success = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({ status: true, status_code: statusCode, message, data });
};

const error = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({ status: false, status_code: statusCode, message, data });
};

module.exports = { success, error };

const success = (res, statusCode, message, data = null) => {
    const response = {
        status: true,
        status_code: statusCode,
        message,
    };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
};

const error = (res, statusCode, message) => {
    return res.status(statusCode).json({
        status: false,
        status_code: statusCode,
        message,
        data: null,
    });
};

module.exports = { success, error };
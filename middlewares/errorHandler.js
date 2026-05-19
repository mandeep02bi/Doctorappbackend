const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: false,
        status_code: statusCode,
        message: err.message || 'Something went wrong',
        data: null,
    });
};

module.exports = errorHandler;

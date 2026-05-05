const crypto = require('crypto');

exports.generateRandomPassword = (length = 8) => {
    // Generate a secure random alphanumeric string
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

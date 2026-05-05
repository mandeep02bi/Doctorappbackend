exports.generateOTP = () => {
    // 4-digit OTP for password reset
    return Math.floor(1000 + Math.random() * 9000).toString();
};

exports.generate10DigitOTP = () => {
    // 10-digit OTP for Admin account creation verification
    // Uses crypto for secure randomness
    const crypto = require('crypto');
    return parseInt(crypto.randomBytes(5).toString('hex'), 16).toString().slice(0, 10).padStart(10, '1');
};

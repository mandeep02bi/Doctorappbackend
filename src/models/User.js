const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['admin', 'doctor', 'patient', 'nurse'],
        default: 'patient'
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        unique: true,
        required: true
    },

    password: {
        type: String,
        required: true
    },
    otp: String,
    otpExpiry: Date,
    isVerified: {
        type: Boolean,
        default: false,
    },

    device: String,
    device_id: String,
    device_version: String,
    device_os: String,

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },

    is_blocked: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
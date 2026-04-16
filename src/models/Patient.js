const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    age: Number,
    gender: String,
    bloodGroup: String,
    disease: String,

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null }

}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initDB = require('./config/db.init');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));
app.use('/api/instructions', require('./routes/instruction.routes'));
app.use('/api/consents', require('./routes/consent.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/reminders', require('./routes/reminder.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/records', require('./routes/record.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Health check
app.get('/', (req, res) => {
    res.json({ status: true, message: 'Medical API v2 is running' });
});

// Error handler
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 5000;

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

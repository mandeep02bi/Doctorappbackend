
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const onbordingroutes = require('./routes/onbordingroutes');
const banner = require('./routes/banner');
const reminder = require('./routes/reminderroutes');
const appointment = require('./routes/appointmentroutes');
const adminroutes = require('./routes/adminroutes');
const authroutes = require('./routes/authroutes');
const blood = require('./routes/bloodroutes');
const patient = require('./routes/patientroutes');

app.use('/api', authroutes);
app.use('/api', adminroutes);
app.use('/api', onbordingroutes);
app.use('/api', banner);
app.use('/api',reminder);
app.use('/api', appointment);
app.use('/api', blood);
app.use('/api', patient);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
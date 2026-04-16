const express = require('express');
const app = express();
require("dotenv").config();

const connectDB = require('./config/db');
connectDB();

app.use(express.json());


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patient', require('./routes/patientRoutes'));

module.exports = app;

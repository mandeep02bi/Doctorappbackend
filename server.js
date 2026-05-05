<<<<<<< HEAD
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const onbordingroutes = require('./routes/onbordingroutes');
app.use('/api', onbordingroutes);

app.listen(5000, () => {
    console.log('Server is running on port 5000');
=======
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
>>>>>>> 4e67be4befb3476d335287e5624fc32ced44293f
});
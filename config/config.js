const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'nitin123',
    database: 'health_app'
});

db.connect((err)=>{
    if(err){
        console.log('Error connecting to database:', err);
    }else{
        console.log('Connected to database');
    }
})

module.exports = db;
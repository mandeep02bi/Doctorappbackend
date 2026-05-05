const mysql = require('mysql2/promise');

// Pool is created once and shared across all requests
const pool = mysql.createPool({
    host:             process.env.DB_HOST     || 'localhost',
    port:             process.env.DB_PORT     || 3306,
    user:             process.env.DB_USER     || 'root',
    password:         process.env.DB_PASSWORD || '',
    database:         process.env.DB_NAME     || 'medical_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0
});

// Test the connection when the server starts
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully to database:', process.env.DB_NAME);
        connection.release();
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        process.exit(1); // Stop the server if DB is unreachable
    }
})();

module.exports = pool;
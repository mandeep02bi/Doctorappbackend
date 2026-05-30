const pool = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const initDB = async () => {
    try {
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        const statements = schema
            .replace(/DELIMITER \/\/[\s\S]*?DELIMITER ;/g, '')
            .replace(/--.*$/gm, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const stmt of statements) {
            try {
                await pool.query(stmt);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') continue;
                if (err.message.includes('Duplicate')) continue;
                console.log('Skipping:', err.message.substring(0, 80));
            }
        }

        // Create triggers manually
        const conn = await pool.getConnection();
        try {
            await conn.query('DROP TRIGGER IF EXISTS generate_user_code');
            await conn.query(`
                CREATE TRIGGER generate_user_code
                BEFORE INSERT ON users
                FOR EACH ROW
                BEGIN
                    DECLARE next_num INT;
                    IF NEW.role = 'Doctor' THEN
                        SELECT COALESCE(MAX(CAST(SUBSTRING(user_code, 3) AS UNSIGNED)), 0) + 1 INTO next_num FROM users WHERE role = 'Doctor';
                        SET NEW.user_code = CONCAT('DR', LPAD(next_num, 4, '0'));
                    ELSEIF NEW.role = 'Staff' THEN
                        SELECT COALESCE(MAX(CAST(SUBSTRING(user_code, 3) AS UNSIGNED)), 0) + 1 INTO next_num FROM users WHERE role = 'Staff';
                        SET NEW.user_code = CONCAT('ST', LPAD(next_num, 4, '0'));
                    END IF;
                END
            `);

            await conn.query('DROP TRIGGER IF EXISTS generate_patient_code');
            await conn.query(`
                CREATE TRIGGER generate_patient_code
                BEFORE INSERT ON patients
                FOR EACH ROW
                BEGIN
                    DECLARE next_num INT;
                    SELECT COALESCE(MAX(CAST(SUBSTRING(patient_code, 3) AS UNSIGNED)), 0) + 1 INTO next_num FROM patients;
                    SET NEW.patient_code = CONCAT('PT', LPAD(next_num, 4, '0'));
                END
            `);
            console.log('Triggers created');
        } catch (err) {
            console.log('Trigger note:', err.message.substring(0, 80));
        } finally {
            conn.release();
        }

        // Seed admin
        const [admins] = await pool.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['Admin']);
        if (admins.length === 0) {
            const hash = await bcrypt.hash('Admin@2026', 10);
            await pool.query(
                'INSERT INTO users (first_name, last_name, email, phone, password, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['Super', 'Admin', 'np6866181@gmail.com', '0000000000', hash, 'Admin', true]
            );
            console.log('Admin seeded: np6866181@gmail.com / Admin@2026');
        }

        console.log('Database initialized');
    } catch (err) {
        console.error('DB init error:', err.message);
    }
};

module.exports = initDB;
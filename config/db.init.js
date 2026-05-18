const pool = require('./db');
const bcrypt = require('bcrypt');

const initDB = async () => {
    try {
        // ============================================================
        // TABLE 1: users
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                user_code       VARCHAR(10)   UNIQUE DEFAULT NULL,
                first_name      VARCHAR(100)  NOT NULL,
                last_name       VARCHAR(100)  NOT NULL,
                email           VARCHAR(150)  UNIQUE NOT NULL,
                phone           VARCHAR(20),
                password        VARCHAR(255)  NOT NULL,
                role            ENUM('Admin', 'Doctor', 'Staff') NOT NULL,
                isVerified      BOOLEAN       DEFAULT false,
                isDeleted       BOOLEAN       DEFAULT false,
                otp             VARCHAR(10)   DEFAULT NULL,
                otp_expiry      DATETIME      DEFAULT NULL,
                platform        ENUM('web', 'android', 'ios', 'unknown') DEFAULT 'unknown',
                device_type     ENUM('mobile', 'tablet', 'desktop', 'unknown') DEFAULT 'unknown',
                refresh_token   TEXT          DEFAULT NULL,
                last_login_at   DATETIME      DEFAULT NULL,
                created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TRIGGER: user_code → DR0001 / ST0001 / Admin → NULL
        // ============================================================
        const [userTriggers] = await pool.query(`
            SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'generate_user_code'
        `);

        if (userTriggers.length === 0) {
            await pool.query(`
                CREATE TRIGGER generate_user_code
                BEFORE INSERT ON users
                FOR EACH ROW
                BEGIN
                    DECLARE next_num INT;
                    IF NEW.role = 'Doctor' THEN
                        SELECT COUNT(*) + 1 INTO next_num FROM users WHERE role = 'Doctor';
                        SET NEW.user_code = CONCAT('DR', LPAD(next_num, 4, '0'));
                    ELSEIF NEW.role = 'Staff' THEN
                        SELECT COUNT(*) + 1 INTO next_num FROM users WHERE role = 'Staff';
                        SET NEW.user_code = CONCAT('ST', LPAD(next_num, 4, '0'));
                    END IF;
                END
            `);
        }

        // ============================================================
        // TABLE 2: doctors_profile
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS doctors_profile (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                user_id       INT NOT NULL UNIQUE,
                specialty     VARCHAR(100),
                experience    VARCHAR(100),
                qualification VARCHAR(255),
                profile_photo VARCHAR(500)  DEFAULT NULL,
                updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 3: patients
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id                  INT AUTO_INCREMENT PRIMARY KEY,
                patient_code        VARCHAR(10)   UNIQUE DEFAULT NULL,
                created_by_staff_id INT NOT NULL,
                first_name          VARCHAR(100)  NOT NULL,
                last_name           VARCHAR(100)  NOT NULL,
                email               VARCHAR(150)  DEFAULT NULL,
                phone               VARCHAR(20)   DEFAULT NULL,
                date_of_birth       DATE,
                gender              ENUM('Male', 'Female', 'Other'),
                profile_photo       VARCHAR(500)  DEFAULT NULL,
                blood_group         VARCHAR(5),
                height_cm           FLOAT,
                weight_kg           FLOAT,
                pulse               INT,
                respiratory_rate    INT,
                allergies           TEXT,
                past_medical_history TEXT,
                street_address      VARCHAR(255),
                city                VARCHAR(100),
                state               VARCHAR(100),
                zip_code            VARCHAR(20),
                isDeleted           BOOLEAN       DEFAULT false,
                created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
                updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_staff_id) REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TRIGGER: patient_code → PT0001, PT0002...
        // ============================================================
        const [patientTriggers] = await pool.query(`
            SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'generate_patient_code'
        `);

        if (patientTriggers.length === 0) {
            await pool.query(`
                CREATE TRIGGER generate_patient_code
                BEFORE INSERT ON patients
                FOR EACH ROW
                BEGIN
                    DECLARE next_num INT;
                    SELECT AUTO_INCREMENT INTO next_num
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'patients';
                    SET NEW.patient_code = CONCAT('PT', LPAD(next_num, 4, '0'));
                END
            `);
        }

        // ============================================================
        // TABLE 4: appointments
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                patient_id       INT NOT NULL,
                doctor_id        INT NOT NULL,
                booked_by        INT NOT NULL,
                appointment_date DATETIME NOT NULL,
                reason           VARCHAR(255),
                notes            TEXT,
                status           ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
                isDeleted        BOOLEAN   DEFAULT false,
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id),
                FOREIGN KEY (doctor_id)  REFERENCES users(id),
                FOREIGN KEY (booked_by)  REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 5: prescriptions
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS prescriptions (
                id             INT AUTO_INCREMENT PRIMARY KEY,
                patient_id     INT NOT NULL,
                doctor_id      INT NOT NULL,
                appointment_id INT DEFAULT NULL,
                diagnosis      TEXT,
                notes          TEXT,
                isDeleted      BOOLEAN   DEFAULT false,
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id)     REFERENCES patients(id),
                FOREIGN KEY (doctor_id)      REFERENCES users(id),
                FOREIGN KEY (appointment_id) REFERENCES appointments(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 6: prescription_medicines
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS prescription_medicines (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                prescription_id INT NOT NULL,
                name            VARCHAR(150) NOT NULL,
                dosage          VARCHAR(100),
                frequency       VARCHAR(100),
                duration        VARCHAR(100),
                instructions    TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 7: prescription_lab_tests
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS prescription_lab_tests (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                prescription_id INT NOT NULL,
                test_name       VARCHAR(150) NOT NULL,
                notes           TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 8: records
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS records (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                patient_id   INT NOT NULL,
                uploaded_by  INT NOT NULL,
                file_url     VARCHAR(500) NOT NULL,
                file_name    VARCHAR(255),
                file_size    INT,
                file_type    ENUM(
                                'Prescription',
                                'Lab Report',
                                'X-Ray',
                                'MRI',
                                'CT Scan',
                                'Invoice',
                                'Certificate',
                                'Insurance Document',
                                'Consent Form',
                                'General Medical Record'
                             ) NOT NULL,
                title        VARCHAR(255),
                notes        TEXT,
                isDeleted    BOOLEAN   DEFAULT false,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id)  REFERENCES patients(id),
                FOREIGN KEY (uploaded_by) REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 9: reminders
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reminders (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                patient_id   INT NOT NULL,
                created_by   INT NOT NULL,
                title        VARCHAR(255) NOT NULL,
                description  TEXT,
                remind_at    DATETIME NOT NULL,
                is_done      BOOLEAN   DEFAULT false,
                isDeleted    BOOLEAN   DEFAULT false,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 10: invoices
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                patient_id    INT NOT NULL,
                created_by    INT NOT NULL,
                total_amount  DECIMAL(10, 2) NOT NULL,
                status        ENUM('Unpaid', 'Paid', 'Cancelled') DEFAULT 'Unpaid',
                description   TEXT,
                notes         TEXT,
                isDeleted     BOOLEAN   DEFAULT false,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 11: certificates
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                patient_id   INT NOT NULL,
                doctor_id    INT NOT NULL,
                title        VARCHAR(255) NOT NULL,
                content      TEXT NOT NULL,
                valid_until  DATE DEFAULT NULL,
                isDeleted    BOOLEAN   DEFAULT false,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id),
                FOREIGN KEY (doctor_id)  REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 12: templates
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS templates (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                created_by  INT NOT NULL,
                type        ENUM('Prescription', 'Certificate', 'General') NOT NULL,
                title       VARCHAR(255) NOT NULL,
                content     TEXT NOT NULL,
                isDeleted   BOOLEAN   DEFAULT false,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // TABLE 13: notifications
        // ============================================================
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                user_id     INT NOT NULL,
                title       VARCHAR(255) NOT NULL,
                message     TEXT,
                type        ENUM(
                                'Appointment',
                                'Prescription',
                                'Reminder',
                                'Invoice',
                                'Certificate',
                                'General'
                            ) DEFAULT 'General',
                is_read     BOOLEAN   DEFAULT false,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `);

        // ============================================================
        // INDEXES — only create if not exists
        // ============================================================
        const createIndex = async (name, table, columns) => {
            const [existing] = await pool.query(`
                SELECT INDEX_NAME FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            `, [table, name]);

            if (existing.length === 0) {
                await pool.query(`CREATE INDEX ${name} ON ${table}(${columns})`);
            }
        };

        // users
        await createIndex('idx_users_user_code', 'users', 'user_code');
        await createIndex('idx_users_email', 'users', 'email');
        await createIndex('idx_users_role', 'users', 'role');
        await createIndex('idx_users_isDeleted', 'users', 'isDeleted');

        // doctors_profile
        await createIndex('idx_doctors_profile_user_id', 'doctors_profile', 'user_id');

        // patients
        await createIndex('idx_patients_patient_code', 'patients', 'patient_code');
        await createIndex('idx_patients_staff_id', 'patients', 'created_by_staff_id');
        await createIndex('idx_patients_isDeleted', 'patients', 'isDeleted');
        await createIndex('idx_patients_name', 'patients', 'first_name, last_name');

        // appointments
        await createIndex('idx_appointments_patient_id', 'appointments', 'patient_id');
        await createIndex('idx_appointments_doctor_id', 'appointments', 'doctor_id');
        await createIndex('idx_appointments_date', 'appointments', 'appointment_date');
        await createIndex('idx_appointments_status', 'appointments', 'status');
        await createIndex('idx_appointments_isDeleted', 'appointments', 'isDeleted');

        // prescriptions
        await createIndex('idx_prescriptions_patient_id', 'prescriptions', 'patient_id');
        await createIndex('idx_prescriptions_doctor_id', 'prescriptions', 'doctor_id');
        await createIndex('idx_prescriptions_isDeleted', 'prescriptions', 'isDeleted');

        // prescription_medicines
        await createIndex('idx_presc_medicines_presc_id', 'prescription_medicines', 'prescription_id');

        // prescription_lab_tests
        await createIndex('idx_presc_lab_presc_id', 'prescription_lab_tests', 'prescription_id');

        // records
        await createIndex('idx_records_patient_id', 'records', 'patient_id');
        await createIndex('idx_records_file_type', 'records', 'file_type');
        await createIndex('idx_records_isDeleted', 'records', 'isDeleted');

        // reminders
        await createIndex('idx_reminders_patient_id', 'reminders', 'patient_id');
        await createIndex('idx_reminders_remind_at', 'reminders', 'remind_at');
        await createIndex('idx_reminders_is_done', 'reminders', 'is_done');

        // invoices
        await createIndex('idx_invoices_patient_id', 'invoices', 'patient_id');
        await createIndex('idx_invoices_status', 'invoices', 'status');

        // certificates
        await createIndex('idx_certificates_patient_id', 'certificates', 'patient_id');
        await createIndex('idx_certificates_doctor_id', 'certificates', 'doctor_id');

        // templates
        await createIndex('idx_templates_created_by', 'templates', 'created_by');
        await createIndex('idx_templates_type', 'templates', 'type');

        // notifications
        await createIndex('idx_notifications_user_id', 'notifications', 'user_id');
        await createIndex('idx_notifications_is_read', 'notifications', 'is_read');

        // ============================================================
        // SEED: Default Admin — admin@medical.com / Admin@1234
        // ============================================================
        const [adminExists] = await pool.query(
            `SELECT id FROM users WHERE email = 'admin@medical.com'`
        );

        if (adminExists.length === 0) {
            const hashedPassword = await bcrypt.hash('Admin@1234', 10);
            await pool.query(
                `INSERT INTO users (first_name, last_name, email, password, role, isVerified, platform, device_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Super', 'Admin', 'admin@medical.com', hashedPassword, 'Admin', true, 'web', 'desktop']
            );
            console.log('Default admin created → admin@medical.com / Admin@1234');
        }

        console.log('Database initialized successfully');

    } catch (err) {
        console.error('Database initialization failed:', err.message);
        process.exit(1);
    }
};

module.exports = initDB;
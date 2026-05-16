-- ============================================================
-- MEDICAL CLINIC MANAGEMENT SYSTEM — COMPLETE DATABASE FILE
-- Roles: Admin | Doctor | Staff
-- Codes: Doctor → DR0001 | Staff → ST0001 | Patient → PT0001
-- ============================================================

CREATE DATABASE IF NOT EXISTS medical_db;
USE medical_db;

-- ============================================================
-- TABLE 1: users
-- Login table for Admin, Doctor, Staff only
-- Patients are NOT users — stored in patients table separately
-- user_code auto-generated via trigger:
--   Doctor → DR0001, DR0002...
--   Staff  → ST0001, ST0002...
--   Admin  → no code
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,

    -- Auto-generated code based on role (DR0001 / ST0001)
    user_code       VARCHAR(10)   UNIQUE DEFAULT NULL,

    first_name      VARCHAR(100)  NOT NULL,
    last_name       VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password        VARCHAR(255)  NOT NULL,
    role            ENUM('Admin', 'Doctor', 'Staff') NOT NULL,

    -- Admin must approve Doctors & Staff before they can login
    isVerified      BOOLEAN       DEFAULT false,

    -- Soft delete — never hard erase medical data
    isDeleted       BOOLEAN       DEFAULT false,

    -- OTP for forgot password & email verification
    otp             VARCHAR(10)   DEFAULT NULL,
    otp_expiry      DATETIME      DEFAULT NULL,

    -- Track where the user is logging in from
    platform        ENUM('web', 'android', 'ios', 'unknown') DEFAULT 'unknown',
    device_type     ENUM('mobile', 'tablet', 'desktop', 'unknown') DEFAULT 'unknown',

    -- JWT token for logout / token invalidation
    refresh_token   TEXT          DEFAULT NULL,

    -- Track last login
    last_login_at   DATETIME      DEFAULT NULL,

    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TRIGGER: Auto-generate user_code on insert based on role
-- Doctor → DR0001, DR0002...
-- Staff  → ST0001, ST0002...
-- Admin  → no code (left NULL)
-- ============================================================
DELIMITER //
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
END//
DELIMITER ;

-- ============================================================
-- TABLE 2: doctors_profile
-- Extra info for Doctor role only
-- Linked to users via user_id
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors_profile (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL UNIQUE,
    specialty     VARCHAR(100),
    experience    VARCHAR(100),
    qualification VARCHAR(255),
    profile_photo VARCHAR(500)  DEFAULT NULL,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- TABLE 3: patients
-- Standalone table — patients do NOT login, not in users
-- Created by Staff only
-- patient_code auto-generated via trigger: PT0001, PT0002...
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id                  INT AUTO_INCREMENT PRIMARY KEY,

    -- Auto-generated patient ID e.g. PT0001
    patient_code        VARCHAR(10)   UNIQUE DEFAULT NULL,

    -- Staff member who created this patient record
    created_by_staff_id INT NOT NULL,

    -- Basic Info
    first_name          VARCHAR(100)  NOT NULL,
    last_name           VARCHAR(100)  NOT NULL,
    email               VARCHAR(150)  DEFAULT NULL,
    phone               VARCHAR(20)   DEFAULT NULL,

    -- Personal Info
    date_of_birth       DATE,
    gender              ENUM('Male', 'Female', 'Other'),
    profile_photo       VARCHAR(500)  DEFAULT NULL,

    -- Vitals & Medical History
    blood_group         VARCHAR(5),
    height_cm           FLOAT,
    weight_kg           FLOAT,
    pulse               INT,
    respiratory_rate    INT,
    allergies           TEXT,
    past_medical_history TEXT,

    -- Address
    street_address      VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    zip_code            VARCHAR(20),

    isDeleted           BOOLEAN       DEFAULT false,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by_staff_id) REFERENCES users(id)
);

-- ============================================================
-- TRIGGER: Auto-generate patient_code on insert
-- Format: PT + 4-digit padded number → PT0001, PT0002...
-- ============================================================
DELIMITER //
CREATE TRIGGER generate_patient_code
BEFORE INSERT ON patients
FOR EACH ROW
BEGIN
    DECLARE next_num INT;
    SELECT AUTO_INCREMENT INTO next_num
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'patients';
    SET NEW.patient_code = CONCAT('PT', LPAD(next_num, 4, '0'));
END//
DELIMITER ;

-- ============================================================
-- TABLE 4: appointments
-- Booked by Staff on behalf of Patient
-- patient_id → patients.id | doctor_id → users.id
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT NOT NULL,
    doctor_id        INT NOT NULL,
    booked_by        INT NOT NULL,         -- users.id of Staff who booked

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
);

-- ============================================================
-- TABLE 5: prescriptions
-- Written by Doctor only
-- Medicines and Lab Tests in separate child tables
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    patient_id     INT NOT NULL,
    doctor_id      INT NOT NULL,
    appointment_id INT DEFAULT NULL,       -- optionally linked to an appointment
    diagnosis      TEXT,
    notes          TEXT,
    isDeleted      BOOLEAN   DEFAULT false,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)     REFERENCES patients(id),
    FOREIGN KEY (doctor_id)      REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- ============================================================
-- TABLE 6: prescription_medicines
-- One row = one medicine inside a prescription (One-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    dosage          VARCHAR(100),          -- e.g. "500mg"
    frequency       VARCHAR(100),          -- e.g. "Twice a day"
    duration        VARCHAR(100),          -- e.g. "7 days"
    instructions    TEXT,                  -- e.g. "Take after meals"
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
);

-- ============================================================
-- TABLE 7: prescription_lab_tests
-- Lab tests ordered inside a prescription (Doctor only)
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_lab_tests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    test_name       VARCHAR(150) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
);

-- ============================================================
-- TABLE 8: records
-- Uploaded files linked to a patient
-- Uploaded by Doctor or Staff
-- ============================================================
CREATE TABLE IF NOT EXISTS records (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    patient_id   INT NOT NULL,
    uploaded_by  INT NOT NULL,             -- users.id (Doctor or Staff)
    file_url     VARCHAR(500) NOT NULL,    -- Multer path / S3 URL
    file_name    VARCHAR(255),
    file_size    INT,                      -- size in KB
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
);

-- ============================================================
-- TABLE 9: reminders
-- Created by Staff for patient follow-ups
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    patient_id   INT NOT NULL,
    created_by   INT NOT NULL,             -- users.id (Staff)
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    remind_at    DATETIME NOT NULL,
    is_done      BOOLEAN   DEFAULT false,
    isDeleted    BOOLEAN   DEFAULT false,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- TABLE 10: invoices
-- Created by Staff only
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    patient_id    INT NOT NULL,
    created_by    INT NOT NULL,            -- users.id (Staff)
    total_amount  DECIMAL(10, 2) NOT NULL,
    status        ENUM('Unpaid', 'Paid', 'Cancelled') DEFAULT 'Unpaid',
    description   TEXT,
    notes         TEXT,
    isDeleted     BOOLEAN   DEFAULT false,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- TABLE 11: certificates
-- Written by Doctor only
-- ============================================================
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
);

-- ============================================================
-- TABLE 12: templates
-- Reusable templates managed by Doctor only
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    created_by  INT NOT NULL,              -- users.id (Doctor)
    type        ENUM('Prescription', 'Certificate', 'General') NOT NULL,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    isDeleted   BOOLEAN   DEFAULT false,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- TABLE 13: notifications
-- In-app notifications for Doctors and Staff
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,              -- users.id (Doctor or Staff)
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
);

-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_user_code  ON users(user_code);
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_isDeleted  ON users(isDeleted);

-- doctors_profile
CREATE INDEX idx_doctors_profile_user_id ON doctors_profile(user_id);

-- patients
CREATE INDEX idx_patients_patient_code ON patients(patient_code);
CREATE INDEX idx_patients_staff_id     ON patients(created_by_staff_id);
CREATE INDEX idx_patients_isDeleted    ON patients(isDeleted);
CREATE INDEX idx_patients_name         ON patients(first_name, last_name);

-- appointments
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id  ON appointments(doctor_id);
CREATE INDEX idx_appointments_date       ON appointments(appointment_date);
CREATE INDEX idx_appointments_status     ON appointments(status);
CREATE INDEX idx_appointments_isDeleted  ON appointments(isDeleted);

-- prescriptions
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id  ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_isDeleted  ON prescriptions(isDeleted);

-- prescription_medicines
CREATE INDEX idx_presc_medicines_presc_id ON prescription_medicines(prescription_id);

-- prescription_lab_tests
CREATE INDEX idx_presc_lab_presc_id ON prescription_lab_tests(prescription_id);

-- records
CREATE INDEX idx_records_patient_id ON records(patient_id);
CREATE INDEX idx_records_file_type  ON records(file_type);
CREATE INDEX idx_records_isDeleted  ON records(isDeleted);

-- reminders
CREATE INDEX idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX idx_reminders_remind_at  ON reminders(remind_at);
CREATE INDEX idx_reminders_is_done    ON reminders(is_done);

-- invoices
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_status     ON invoices(status);

-- certificates
CREATE INDEX idx_certificates_patient_id ON certificates(patient_id);
CREATE INDEX idx_certificates_doctor_id  ON certificates(doctor_id);

-- templates
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_type       ON templates(type);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);


-- ============================================================
-- SEED DATA
-- Default Admin — login and change password immediately
-- Password: Admin@1234 (bcrypt hashed)
-- Admin has no user_code — trigger skips Admin role
-- ============================================================
INSERT IGNORE INTO users (first_name, last_name, email, password, role, isVerified, platform, device_type)
VALUES (
    'Super', 'Admin',
    'admin@medical.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin',
    true,
    'web',
    'desktop'
);


-- ============================================================
-- INSERT QUERY REFERENCES — For Backend Developers
-- ============================================================


-- ============================================================
-- AUTH
-- ============================================================

-- Register Doctor (user_code DR0001 auto-generated by trigger)
-- INSERT INTO users (first_name, last_name, email, phone, password, role, platform, device_type)
-- VALUES (?, ?, ?, ?, ?, 'Doctor', ?, ?);

-- Register Staff (user_code ST0001 auto-generated by trigger)
-- INSERT INTO users (first_name, last_name, email, phone, password, role, platform, device_type)
-- VALUES (?, ?, ?, ?, ?, 'Staff', ?, ?);

-- Save refresh token after login
-- UPDATE users SET refresh_token = ?, last_login_at = NOW() WHERE id = ?;

-- Logout: clear refresh token
-- UPDATE users SET refresh_token = NULL WHERE id = ?;

-- Forgot Password: save OTP with 10 min expiry
-- UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
-- WHERE email = ? AND isDeleted = false;

-- Reset Password: clear OTP and update password
-- UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE id = ?;

-- Soft Delete User
-- UPDATE users SET isDeleted = true WHERE id = ?;


-- ============================================================
-- DOCTORS PROFILE
-- ============================================================

-- Create Doctor Profile (after registering Doctor in users)
-- INSERT INTO doctors_profile (user_id, specialty, experience, qualification, profile_photo)
-- VALUES (?, ?, ?, ?, ?);

-- Update Doctor Profile
-- UPDATE doctors_profile SET specialty = ?, experience = ?, qualification = ?, profile_photo = ?
-- WHERE user_id = ?;


-- ============================================================
-- PATIENTS
-- ============================================================

-- Create Patient (patient_code PT0001 auto-generated by trigger — do NOT insert manually)
-- INSERT INTO patients
-- (created_by_staff_id, first_name, last_name, email, phone,
--  date_of_birth, gender, blood_group, height_cm, weight_kg,
--  pulse, respiratory_rate, allergies, past_medical_history,
--  street_address, city, state, zip_code)
-- VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Update Patient
-- UPDATE patients SET first_name = ?, last_name = ?, phone = ?, date_of_birth = ?,
-- gender = ?, blood_group = ?, height_cm = ?, weight_kg = ?, pulse = ?,
-- respiratory_rate = ?, allergies = ?, past_medical_history = ?,
-- street_address = ?, city = ?, state = ?, zip_code = ?
-- WHERE id = ? AND isDeleted = false;

-- Soft Delete Patient
-- UPDATE patients SET isDeleted = true WHERE id = ?;


-- ============================================================
-- APPOINTMENTS
-- ============================================================

-- Create Appointment
-- INSERT INTO appointments (patient_id, doctor_id, booked_by, appointment_date, reason, notes)
-- VALUES (?, ?, ?, ?, ?, ?);

-- Update Appointment
-- UPDATE appointments SET appointment_date = ?, reason = ?, notes = ? WHERE id = ?;

-- Update Appointment Status
-- UPDATE appointments SET status = ? WHERE id = ? AND isDeleted = false;

-- Soft Delete Appointment
-- UPDATE appointments SET isDeleted = true WHERE id = ?;


-- ============================================================
-- PRESCRIPTIONS
-- ============================================================

-- Create Prescription
-- INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, diagnosis, notes)
-- VALUES (?, ?, ?, ?, ?);

-- Add Medicine to Prescription
-- INSERT INTO prescription_medicines (prescription_id, name, dosage, frequency, duration, instructions)
-- VALUES (?, ?, ?, ?, ?, ?);

-- Add Lab Test to Prescription
-- INSERT INTO prescription_lab_tests (prescription_id, test_name, notes)
-- VALUES (?, ?, ?);

-- Update Prescription
-- UPDATE prescriptions SET diagnosis = ?, notes = ? WHERE id = ? AND isDeleted = false;

-- Update Medicine
-- UPDATE prescription_medicines SET name = ?, dosage = ?, frequency = ?, duration = ?, instructions = ?
-- WHERE id = ?;

-- Delete Medicine
-- DELETE FROM prescription_medicines WHERE id = ?;

-- Delete Lab Test
-- DELETE FROM prescription_lab_tests WHERE id = ?;

-- Soft Delete Prescription
-- UPDATE prescriptions SET isDeleted = true WHERE id = ?;


-- ============================================================
-- RECORDS
-- ============================================================

-- Upload Record
-- INSERT INTO records (patient_id, uploaded_by, file_url, file_name, file_size, file_type, title, notes)
-- VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- Soft Delete Record
-- UPDATE records SET isDeleted = true WHERE id = ?;


-- ============================================================
-- REMINDERS
-- ============================================================

-- Create Reminder
-- INSERT INTO reminders (patient_id, created_by, title, description, remind_at)
-- VALUES (?, ?, ?, ?, ?);

-- Update Reminder
-- UPDATE reminders SET title = ?, description = ?, remind_at = ? WHERE id = ?;

-- Mark Reminder as Done
-- UPDATE reminders SET is_done = true WHERE id = ?;

-- Soft Delete Reminder
-- UPDATE reminders SET isDeleted = true WHERE id = ?;


-- ============================================================
-- INVOICES
-- ============================================================

-- Create Invoice
-- INSERT INTO invoices (patient_id, created_by, total_amount, description, notes)
-- VALUES (?, ?, ?, ?, ?);

-- Update Invoice Status
-- UPDATE invoices SET status = ? WHERE id = ? AND isDeleted = false;

-- Soft Delete Invoice
-- UPDATE invoices SET isDeleted = true WHERE id = ?;


-- ============================================================
-- CERTIFICATES
-- ============================================================

-- Create Certificate
-- INSERT INTO certificates (patient_id, doctor_id, title, content, valid_until)
-- VALUES (?, ?, ?, ?, ?);

-- Update Certificate
-- UPDATE certificates SET title = ?, content = ?, valid_until = ? WHERE id = ? AND isDeleted = false;

-- Soft Delete Certificate
-- UPDATE certificates SET isDeleted = true WHERE id = ?;


-- ============================================================
-- TEMPLATES
-- ============================================================

-- Create Template
-- INSERT INTO templates (created_by, type, title, content)
-- VALUES (?, ?, ?, ?);

-- Update Template
-- UPDATE templates SET type = ?, title = ?, content = ? WHERE id = ? AND isDeleted = false;

-- Soft Delete Template
-- UPDATE templates SET isDeleted = true WHERE id = ?;


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Create Notification (called internally by system)
-- INSERT INTO notifications (user_id, title, message, type)
-- VALUES (?, ?, ?, ?);

-- Mark as Read
-- UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?;

-- Delete Notification
-- DELETE FROM notifications WHERE id = ? AND user_id = ?;


-- ============================================================
-- ADMIN
-- ============================================================

-- Approve Doctor or Staff
-- UPDATE users SET isVerified = true WHERE id = ? AND role IN ('Doctor', 'Staff');

-- Reject / Soft Delete Doctor or Staff
-- UPDATE users SET isDeleted = true WHERE id = ?;


-- ============================================================
-- END OF FILE
-- ============================================================


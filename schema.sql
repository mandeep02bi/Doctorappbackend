-- ============================================
-- MEDICAL APP DATABASE SCHEMA
-- Run this file in your MySQL client to setup
-- ============================================

CREATE DATABASE IF NOT EXISTS medical_db;
USE medical_db;

-- -------------------------
-- TABLE 1: users
-- Central authentication table for ALL roles
-- Roles: Admin | Doctor | Nurse | Patient
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password        VARCHAR(255) NOT NULL,
    role            ENUM('Admin', 'Doctor', 'Nurse', 'Patient') NOT NULL,
    -- Doctors & Nurses must be approved by Admin before they can use the app
    isVerified      BOOLEAN DEFAULT false,
    -- Soft delete: never hard-erase data; just hide with this flag
    isDeleted       BOOLEAN DEFAULT false,
    -- OTP fields for password reset / email verification
    otp             VARCHAR(10)  DEFAULT NULL,
    otp_expiry      DATETIME     DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- TABLE 2: patients_profile
-- Extra details for Patient role (created by Nurse only)
-- Matches "Add New Patient" 3-step form in images
-- -------------------------
CREATE TABLE IF NOT EXISTS patients_profile (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    user_id              INT NOT NULL UNIQUE,
    created_by_nurse_id  INT NOT NULL,
    -- Step 1: Personal Info
    date_of_birth        DATE,
    gender               ENUM('Male', 'Female', 'Other'),
    -- Step 2: Vitals & Medical History
    blood_group          VARCHAR(5),
    height_cm            FLOAT,
    weight_kg            FLOAT,
    pulse                INT,
    respiratory_rate     INT,
    allergies            TEXT,
    past_medical_history TEXT,
    -- Step 3: Address & Location
    street_address       VARCHAR(255),
    city                 VARCHAR(100),
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by_nurse_id) REFERENCES users(id)
);

-- -------------------------
-- TABLE 3: nurses_profile
-- Extra details for Nurse role
-- -------------------------
CREATE TABLE IF NOT EXISTS nurses_profile (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL UNIQUE,
    specialty    VARCHAR(100),
    experience   VARCHAR(100),
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- -------------------------
-- TABLE 4: doctors_profile
-- Extra details for Doctor role (Profile, Specialty etc.)
-- -------------------------
CREATE TABLE IF NOT EXISTS doctors_profile (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL UNIQUE,
    specialty    VARCHAR(100),
    experience   VARCHAR(100),
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- -------------------------
-- TABLE 5: appointments
-- Booked by Patient OR Nurse (on behalf of Patient)
-- Each appointment links one Patient ↔ one Doctor
-- -------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT NOT NULL,
    doctor_id        INT NOT NULL,
    booked_by        INT NOT NULL,   -- user_id of who booked (Patient or Nurse)
    appointment_date DATETIME NOT NULL,
    reason           VARCHAR(255),
    status           ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    isDeleted        BOOLEAN DEFAULT false,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id)  REFERENCES users(id),
    FOREIGN KEY (booked_by)  REFERENCES users(id)
);

-- -------------------------
-- TABLE 6: prescriptions
-- Doctor writes prescriptions for patients (from Doctor image: Prescribe action)
-- -------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    patient_id   INT NOT NULL,
    doctor_id    INT NOT NULL,
    notes        TEXT,
    medicines    TEXT,
    isDeleted    BOOLEAN DEFAULT false,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id)  REFERENCES users(id)
);

-- -------------------------
-- SEED: Create the first Admin account
-- Password here is bcrypt hash of: Admin@1234
-- After seeding, login and change password IMMEDIATELY
-- -------------------------
INSERT IGNORE INTO users (first_name, last_name, email, password, role, isVerified)
VALUES (
    'Super', 'Admin',
    'admin@medical.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'Admin',
    true
);

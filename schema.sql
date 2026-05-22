-- MEDICAL CLINIC MANAGEMENT SYSTEM — 14 Tables

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
);


CREATE TABLE IF NOT EXISTS patients (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    patient_code      VARCHAR(10)   UNIQUE DEFAULT NULL,
    created_by        INT NOT NULL,
    first_name        VARCHAR(100)  NOT NULL,
    middle_name       VARCHAR(100)  DEFAULT NULL,
    last_name         VARCHAR(100)  NOT NULL,
    email             VARCHAR(150)  DEFAULT NULL,
    phone             VARCHAR(20)   DEFAULT NULL,
    date_of_birth     DATE          DEFAULT NULL,
    age               INT           DEFAULT NULL,
    gender            ENUM('Male', 'Female', 'Other'),
    profile_photo     VARCHAR(500)  DEFAULT NULL,
    blood_group       VARCHAR(5),
    street_address    VARCHAR(255),
    city              VARCHAR(100),
    state             VARCHAR(100),
    zip_code          VARCHAR(20),
    isDeleted         BOOLEAN       DEFAULT false,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS appointments (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT DEFAULT NULL,
    doctor_id        INT NOT NULL,
    booked_by        INT NOT NULL,
    patient_name     VARCHAR(255) DEFAULT NULL,
    patient_gender   ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    patient_age      INT DEFAULT NULL,
    patient_age_unit ENUM('Year', 'Month') DEFAULT 'Year',
    patient_dob      DATE DEFAULT NULL,
    patient_whatsapp VARCHAR(20) DEFAULT NULL,
    patient_email    VARCHAR(150) DEFAULT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    purpose          TEXT,
    notes            TEXT,
    status           ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    isDeleted        BOOLEAN   DEFAULT false,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id)  REFERENCES users(id),
    FOREIGN KEY (booked_by)  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    patient_id        INT NOT NULL,
    doctor_id         INT NOT NULL,
    appointment_id    INT DEFAULT NULL,
    temperature       VARCHAR(50)  DEFAULT NULL,
    height            VARCHAR(50)  DEFAULT NULL,
    weight            VARCHAR(50)  DEFAULT NULL,
    pulse             VARCHAR(50)  DEFAULT NULL,
    blood_pressure    VARCHAR(50)  DEFAULT NULL,
    blood_sugar       VARCHAR(50)  DEFAULT NULL,
    hemoglobin        VARCHAR(50)  DEFAULT NULL,
    spo2              VARCHAR(50)  DEFAULT NULL,
    respiration_rate  VARCHAR(50)  DEFAULT NULL,
    allergy           TEXT         DEFAULT NULL,
    chief_complaint   TEXT         DEFAULT NULL,
    history           TEXT         DEFAULT NULL,
    findings          TEXT         DEFAULT NULL,
    diagnosis         TEXT         DEFAULT NULL,
    treatment_advice  TEXT         DEFAULT NULL,
    end_note          TEXT         DEFAULT NULL,
    follow_up_date    DATE         DEFAULT NULL,
    notes             TEXT         DEFAULT NULL,
    prescription_date DATE         DEFAULT NULL,
    isDeleted         BOOLEAN      DEFAULT false,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id)     REFERENCES patients(id),
    FOREIGN KEY (doctor_id)      REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS prescription_medicines (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id     INT NOT NULL,
    name                VARCHAR(255) NOT NULL,
    total_quantity      VARCHAR(50)  DEFAULT NULL,
    frequency           VARCHAR(100) DEFAULT NULL,
    route_form          VARCHAR(100) DEFAULT NULL,
    no_of_days          VARCHAR(50)  DEFAULT NULL,
    instructions        VARCHAR(255) DEFAULT NULL,
    additional_comments TEXT         DEFAULT NULL,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescription_lab_tests (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id     INT NOT NULL,
    test_name           VARCHAR(255) NOT NULL,
    additional_comments TEXT         DEFAULT NULL,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificates (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT NOT NULL,
    doctor_id        INT NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT NOT NULL,
    certificate_date DATE DEFAULT NULL,
    isDeleted        BOOLEAN   DEFAULT false,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id)  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS instructions (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT NOT NULL,
    doctor_id        INT NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT         NOT NULL,
    instruction_date DATE         DEFAULT NULL,
    isDeleted        BOOLEAN      DEFAULT false,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id)  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS consents (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    patient_id    INT NOT NULL,
    doctor_id     INT NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT NOT NULL,
    consent_date  DATE DEFAULT NULL,
    isDeleted     BOOLEAN   DEFAULT false,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id)  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS templates (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    created_by  INT NOT NULL,
    type        ENUM('Medicine', 'Lab Test', 'Instruction') NOT NULL,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    isDeleted   BOOLEAN   DEFAULT false,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reminders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT NOT NULL,
    created_by      INT NOT NULL,
    reminder_type   ENUM('Reminder', 'Payment Reminder') DEFAULT 'Reminder',
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    payment_link    VARCHAR(500) DEFAULT NULL,
    start_date      DATE         DEFAULT NULL,
    end_date        DATE         DEFAULT NULL,
    is_done         BOOLEAN      DEFAULT false,
    isDeleted       BOOLEAN      DEFAULT false,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invoices (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT NOT NULL,
    created_by      INT NOT NULL,
    bill_to_name    VARCHAR(255)   DEFAULT NULL,
    invoice_title   VARCHAR(255)   DEFAULT NULL,
    currency        VARCHAR(10)    DEFAULT 'INR',
    discount_title  VARCHAR(100)   DEFAULT 'Discount',
    discount_value  DECIMAL(10,2)  DEFAULT 0,
    discount_type   ENUM('Amount', 'Percentage') DEFAULT 'Amount',
    advance_title   VARCHAR(100)   DEFAULT 'Amount Paid',
    advance_amount  DECIMAL(10,2)  DEFAULT 0,
    tax_title       VARCHAR(100)   DEFAULT 'GST',
    tax_value       DECIMAL(10,2)  DEFAULT 0,
    tax_type        ENUM('Amount', 'Percentage') DEFAULT 'Percentage',
    remark          TEXT,
    invoice_date    DATE           DEFAULT NULL,
    status          ENUM('To pay', 'Paid', 'None') DEFAULT 'To pay',
    total_amount    DECIMAL(10,2)  DEFAULT 0,
    isDeleted       BOOLEAN        DEFAULT false,
    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id  INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS usage_counter (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE,
    total_count INT DEFAULT 0,
    max_limit   INT DEFAULT 300,
    reset_at    TIMESTAMP DEFAULT NULL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- INDEXES
CREATE INDEX idx_users_code ON users(user_code);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted ON users(isDeleted);
CREATE INDEX idx_users_verified ON users(isVerified);
CREATE INDEX idx_pt_code ON patients(patient_code);
CREATE INDEX idx_pt_created ON patients(created_by);
CREATE INDEX idx_pt_deleted ON patients(isDeleted);
CREATE INDEX idx_pt_name ON patients(first_name, last_name);
CREATE INDEX idx_pt_phone ON patients(phone);
CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_doctor ON appointments(doctor_id);
CREATE INDEX idx_appt_date ON appointments(appointment_date);
CREATE INDEX idx_appt_status ON appointments(status);
CREATE INDEX idx_appt_deleted ON appointments(isDeleted);
CREATE INDEX idx_presc_patient ON prescriptions(patient_id);
CREATE INDEX idx_presc_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_presc_deleted ON prescriptions(isDeleted);
CREATE INDEX idx_presc_date ON prescriptions(prescription_date);
CREATE INDEX idx_med_presc ON prescription_medicines(prescription_id);
CREATE INDEX idx_lab_presc ON prescription_lab_tests(prescription_id);
CREATE INDEX idx_cert_patient ON certificates(patient_id);
CREATE INDEX idx_cert_doctor ON certificates(doctor_id);
CREATE INDEX idx_cert_deleted ON certificates(isDeleted);
CREATE INDEX idx_instr_patient ON instructions(patient_id);
CREATE INDEX idx_instr_doctor ON instructions(doctor_id);
CREATE INDEX idx_instr_deleted ON instructions(isDeleted);
CREATE INDEX idx_consent_patient ON consents(patient_id);
CREATE INDEX idx_consent_doctor ON consents(doctor_id);
CREATE INDEX idx_consent_deleted ON consents(isDeleted);
CREATE INDEX idx_tmpl_by ON templates(created_by);
CREATE INDEX idx_tmpl_type ON templates(type);
CREATE INDEX idx_tmpl_deleted ON templates(isDeleted);
CREATE INDEX idx_rem_patient ON reminders(patient_id);
CREATE INDEX idx_rem_done ON reminders(is_done);
CREATE INDEX idx_rem_type ON reminders(reminder_type);
CREATE INDEX idx_inv_patient ON invoices(patient_id);
CREATE INDEX idx_inv_status ON invoices(status);
CREATE INDEX idx_inv_items ON invoice_items(invoice_id);

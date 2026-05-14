-- =========================================================
-- HEALTH APP DATABASE
-- =========================================================
-- Database Name : health_app
-- Database Type : MySQL
-- Exported From : MySQL Workbench
-- MySQL Version : 8.0.46
-- Export Date   : 2026-05-10
--
-- Description:
-- This database is designed for a healthcare application
-- that manages:
--
-- 1. User Authentication & Authorization
-- 2. OTP Verification System FOR Reset Password
-- 3. Refresh Token Session Management
-- 4. Doctor / Nurse / Staff Management
-- 5. Appointments
-- 6. Reminders & Follow-ups
-- 7. Banner Management
-- 8. Onboarding Screens
--
-- =========================================================


CREATE DATABASE IF NOT EXISTS health_app;
USE health_app;


-- =========================================================
-- TABLE: user
-- =========================================================
-- Stores all users of the system such as:
-- Admins, Doctors, Nurses and Staff Members
-- =========================================================

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
    
    -- Primary Key
    `id` INT NOT NULL AUTO_INCREMENT,

    -- User Basic Information
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,

    -- User Role
    `role` ENUM('admin', 'doctor', 'nurse', 'staff')
    DEFAULT 'staff',

    -- Approval Status
    `status` ENUM('pending', 'approved', 'rejected')
    DEFAULT 'pending',

    -- Account Active Status
    `is_active` TINYINT(1)
    DEFAULT 1,

    -- Device Information
    `device_id` VARCHAR(255) DEFAULT NULL,
    `device_uuid` VARCHAR(255) DEFAULT NULL,
    `device_name` VARCHAR(255) DEFAULT NULL,

    -- Device Platform
    `device_type` ENUM('android', 'ios', 'web')
    DEFAULT NULL,

    -- Operating System Version
    `os_version` VARCHAR(50) DEFAULT NULL,

    -- Account Creation Time
    `created_at` TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    UNIQUE KEY `unique_email` (`email`)
);



-- =========================================================
-- SAMPLE DATA: user
-- =========================================================

INSERT INTO `user`
(
    `id`,
    `name`,
    `email`,
    `password`,
    `role`,
    `status`,
    `is_active`,
    `device_id`,
    `device_uuid`,
    `device_name`,
    `device_type`,
    `os_version`
)
VALUES

(
    3,
    'Nurse Priya',
    'nurse@gmail.com',
    '$2b$10$hashed_password_here',
    'nurse',
    'rejected',
    1,
    'device003',
    'uuid-nurse-001',
    'iPhone 15',
    'ios',
    'iOS 18'
);
(

    7,
    'Dr Aarav Sharma',
    'aarav.doctor@gmail.com',
    '$2b$10$UHW2L918CHEJTLvIJ/rYhuZA9S04Nz9.eXzM4kCvAJmG1aMkwY5GK',
    'doctor',
    'approved',
    1,
    'doctor_device_101',
    'uuid-doc-101',
    'Samsung Galaxy S24',
    'android',
    'Android 14'

);


-- =========================================================
-- TABLE: otp_verify
-- =========================================================
-- Stores OTP verification details for users
-- Used during authentication and email verification
-- =========================================================

DROP TABLE IF EXISTS `otp_verify`;

CREATE TABLE `otp_verify` (

    -- Primary Key
    `id` INT NOT NULL AUTO_INCREMENT,

    -- User Reference
    `user_id` INT DEFAULT NULL,

    -- OTP Code
    `otp_code` VARCHAR(255) DEFAULT NULL,

    -- OTP Expiration Time
    `expires_at` TIMESTAMP DEFAULT NULL,

    -- OTP Used Status
    `is_used` TINYINT(1)
    DEFAULT 0,

    -- OTP Generated Time
    `created_at` TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    KEY `fk_otp_user` (`user_id`),

    CONSTRAINT `fk_otp_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
);



-- =========================================================
-- SAMPLE DATA: otp_verify
-- =========================================================

INSERT INTO `otp_verify`
(
    `id`,
    `user_id`,
    `otp_code`,
    `expires_at`,
    `is_used`
)
VALUES

(
    1,
    2,
    'encrypted_otp_token_here',
    '2026-05-08 14:08:32',
    0
),

(
    2,
    4,
    'encrypted_otp_token_here',
    '2026-05-08 14:14:01',
    1
);



-- =========================================================
-- TABLE: refresh_token
-- =========================================================
-- Stores refresh tokens for persistent login sessions
-- Used in JWT Authentication System
-- =========================================================

DROP TABLE IF EXISTS `refresh_token`;

CREATE TABLE `refresh_token` (

    -- Primary Key
    `id` INT NOT NULL AUTO_INCREMENT,

    -- User Reference
    `user_id` INT DEFAULT NULL,

    -- Refresh Token
    `token` TEXT,

    -- Device UUID
    `device_uuid` VARCHAR(255) DEFAULT NULL,

    -- Token Expiration Time
    `expires_at` TIMESTAMP DEFAULT NULL,

    -- Token Created Time
    `created_at` TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    KEY `fk_refresh_user` (`user_id`),

    CONSTRAINT `fk_refresh_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE
);



-- =========================================================
-- SAMPLE DATA: refresh_token
-- =========================================================

INSERT INTO `refresh_token`
(
    `id`,
    `user_id`,
    `token`,
    `device_uuid`,
    `expires_at`
)
VALUES

(
    1,
    6,
    'encrypted_refresh_token_here',
    'uuid-nurse-001',
    '2026-05-16 14:47:45'
);



-- =========================================================
-- TABLE: appointment
-- =========================================================
-- Stores doctor-patient or nurse-patient appointments
-- =========================================================

DROP TABLE IF EXISTS `appointment`;

CREATE TABLE `appointment` (

    -- Primary Key
    `id` INT NOT NULL AUTO_INCREMENT,

    -- Appointment Sender
    `sender_id` VARCHAR(20) DEFAULT NULL,

    -- Appointment Receiver
    `receiver_id` VARCHAR(20) DEFAULT NULL,

    -- Appointment Type
    `appointment_type`
    ENUM('in_person', 'phone_call')
    DEFAULT NULL,

    -- Appointment Date & Time
    `appointment_datetime`
    DATETIME DEFAULT NULL,

    -- Appointment Status
    `status`
    ENUM('scheduled', 'completed', 'cancelled')
    DEFAULT 'scheduled',

    -- Appointment Created Time
    `created_at`
    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
);



-- =========================================================
-- SAMPLE DATA: appointment
-- =========================================================

INSERT INTO `appointment`
(
    `id`,
    `sender_id`,
    `receiver_id`,
    `appointment_type`,
    `appointment_datetime`,
    `status`
)
VALUES

(
    5,
    'NUR001',
    'PAT102',
    'phone_call',
    '2026-03-12 11:00:00',
    'cancelled'
),

(
    6,
    'DOC002',
    'PAT103',
    'in_person',
    '2026-05-15 14:30:00',
    'completed'
);



-- =========================================================
-- TABLE: reminder
-- =========================================================
-- Stores reminders, payment alerts and follow-up notices
-- =========================================================

DROP TABLE IF EXISTS `reminder`;

CREATE TABLE `reminder` (

    -- Primary Key
    `id` INT NOT NULL AUTO_INCREMENT,

    -- Reminder Sender
    `sender_id` VARCHAR(20) DEFAULT NULL,

    -- Reminder Receiver
    `receiver_id` VARCHAR(20) DEFAULT NULL,

    -- Reminder Type
    `type`
    ENUM('reminder', 'payment', 'followup')
    DEFAULT NULL,

    -- Reminder Title
    `title` VARCHAR(255) DEFAULT NULL,

    -- Reminder Description
    `description` TEXT,

    -- Reminder Date & Time
    `reminder_datetime`
    DATETIME DEFAULT NULL,

    -- Reminder Created Time
    `created_at`
    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
);



-- =========================================================
-- SAMPLE DATA: reminder
-- =========================================================

INSERT INTO `reminder`
(
    `id`,
    `sender_id`,
    `receiver_id`,
    `type`,
    `title`,
    `description`,
    `reminder_datetime`
)
VALUES

(
    1,
    'DOC001',
    'PAT101',
    'reminder',
    'Take Medicine',
    'Take tablet after lunch',
    NULL
),

(
    2,
    'DOC001',
    'PAT101',
    'payment',
    'Pay Consultation Fees',
    '₹500 pending for last visit',
    '2026-03-13 10:00:00'
);



-- =========================================================
-- TABLE: banner
-- =========================================================
-- Stores homepage banners used in mobile/web app
-- =========================================================

DROP TABLE IF EXISTS `banner`;

CREATE TABLE `banner` (

    -- Primary Key
    `id` INT NOT NULL AUTO_INCREMENT,

    -- Banner Image
    `image` VARCHAR(255) NOT NULL,

    -- Banner Main Heading
    `heading` VARCHAR(255) NOT NULL,

    -- Banner Subheading
    `subheading` TEXT,

    PRIMARY KEY (`id`)
);



-- =========================================================
-- SAMPLE DATA: banner
-- =========================================================

INSERT INTO `banner`
(
    `id`,
    `image`,
    `heading`,
    `subheading`
)
VALUES

(
    1,
    'banner1.png',
    'Best Consultation',
    'Best consultation from experienced doctors'
),

(
    2,
    'banner2.png',
    '24/7 Healthcare',
    'Healthcare services available anytime'
);



-- =========================================================
-- TABLE: onboarding
-- =========================================================
-- Stores onboarding screens shown in mobile app
-- =========================================================

DROP TABLE IF EXISTS `onboarding`;

CREATE TABLE `onboarding` (

    -- Primary Key
    `id` INT NOT NULL AUTO_INCREMENT,

    -- Onboarding Image
    `image` VARCHAR(255) NOT NULL,

    -- Main Heading
    `heading` VARCHAR(100) NOT NULL,

    -- Description
    `subheading` TEXT NOT NULL,

    PRIMARY KEY (`id`)
);



-- =========================================================
-- SAMPLE DATA: onboarding
-- =========================================================

INSERT INTO `onboarding`
(
    `id`,
    `image`,
    `heading`,
    `subheading`
)
VALUES

(
    1,
    'profile1.png',
    'Trusted Doctors',
    'Get care from trusted and verified doctors.'
),

(
    2,
    'profile2.png',
    'Choose Best Doctors',
    'Choose the best doctors for better treatment.'
),

(
    3,
    'appointment_img.png',
    'Easy Appointments',
    'Book appointments quickly and easily anytime.'
);



-- =========================================================
-- TABLE: Blood Group
-- =========================================================
-- Stores blood group information only from Admin
-- =========================================================
    
DROP TABLE IF EXISTS `blood_grp`;

CREATE TABLE blood_grp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- =========================================================
-- SAMPLE DATA: blood_groups
-- =========================================================

INSERT INTO `blood_grp`
(
    `id`,
    `name`,
)
VALUES

(
    1,
    'name': 'O+',
    'created_at': '2026-05-14T13:20:30.000Z'
),

(
    2,
    'name': 'A+',
    'created_at': '2026-05-14T13:20:31.000Z'
),

(
    3,
    'name': 'B+',
    'created_at': '2026-05-14T13:20:31.000Z'
);


-- =========================================================
-- TABLE: patient
-- =========================================================
-- Stores patient information
-- =========================================================

DROP TABLE IF EXISTS `patient`;

CREATE TABLE patients (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('male','female','other') NOT NULL,

    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,

    blood_group INT NOT NULL,

    address TEXT,

    created_by INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_blood_group
    FOREIGN KEY (blood_group)
    REFERENCES blood_grp(id),

    CONSTRAINT fk_patient_creator
    FOREIGN KEY (created_by)
    REFERENCES user(id)
);



-- =========================================================
-- SAMPLE DATA: patient
-- =========================================================

INSERT INTO `patient`
(
    `name`,
    `age`,
    `gender`,
    `phone`,
    `email`,
    `blood_group`,
    `created_by`
)
VALUES

(
    1,
    'name': 'Rahul',
    'age': 25,
    'gender': 'male',
    'phone': '9999999999',
    'email': 'rahul@gmail.com',
    'blood_group': 'A+',
    'address': 'Surat',
    'created_by': 9,
    'created_at': '2026-05-14T13:48:54.000Z'
),

(
    2,
    'name': 'Rohit',
    'age': 20,
    'gender': 'male',
    'phone': '9995989699',
    'email': 'rohit111@gmail.com',
    'blood_group': 'B+',
    'address': 'Ahmedabad',
    'created_by': 9,
    'created_at': '2026-05-14T14:24:39.000Z'
)


-- =========================================================
-- DATABASE SETUP COMPLETED
-- =========================================================
-- Tables Included:
--
-- 1. user
-- 2. otp_verify
-- 3. refresh_token
-- 4. appointment
-- 5. reminder
-- 6. banner
-- 7. onboarding
-- 8. blood_grp
-- 9. patient
--
-- =========================================================
-- END OF FILE
-- =========================================================
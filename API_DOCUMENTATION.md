# Medical App — API Documentation for Frontend

**Base URL:** `http://localhost:5000/api`

**Total Endpoints:** 67

**Global Response Format (every API follows this):**
```json
{
    "status": true | false,
    "status_code": 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500,
    "message": "Human readable message for toast/modal",
    "data": { } | [ ] | null
}
```

**Auth Header (required on all endpoints except register, login, forgot-password, verify-otp, reset-password):**
```
Authorization: Bearer <accessToken>
```

---

## AUTH ENDPOINTS (7)

---

### 1. POST /api/auth/register
**Why:** New Doctor or Staff creates their account.
**Where:** Register screen → registration form → submit button.
**Who:** Anyone (no token needed).

**Request:**
```json
{
    "first_name": "Amit",
    "last_name": "Sharma",
    "email": "amit@doctor.com",
    "phone": "9876543210",
    "password": "Doctor@123",
    "role": "Doctor",
    "platform": "android",
    "device_type": "mobile"
}
```

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Registration successful",
    "data": {
        "id": 2,
        "user_code": "DR0001",
        "first_name": "Amit",
        "last_name": "Sharma",
        "email": "amit@doctor.com",
        "role": "Doctor"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "Admin registration is not allowed", "data": null }
{ "status": false, "status_code": 409, "message": "Email already registered", "data": null }
{ "status": false, "status_code": 400, "message": "Role must be Doctor or Staff", "data": null }
```

**Frontend action:** On success → show green toast → redirect to login screen.

---

### 2. POST /api/auth/login
**Why:** Doctor, Staff, or Admin logs into the app.
**Where:** Login screen → email/password form → login button.
**Who:** Anyone (no token needed).

**Request:**
```json
{
    "email": "amit@doctor.com",
    "password": "Doctor@123",
    "platform": "android",
    "device_type": "mobile"
}
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 2,
            "first_name": "Amit",
            "last_name": "Sharma",
            "email": "amit@doctor.com",
            "role": "Doctor",
            "user_code": "DR0001"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 401, "message": "Invalid email or password", "data": null }
```

**Frontend action:**
- Save `accessToken` in AsyncStorage/SecureStorage.
- Save `user` object for role-based UI rendering.
- Redirect to Dashboard.
- Use `user.role` to show/hide menu items:
  - Doctor → show Prescriptions, Certificates, Templates
  - Staff → show Invoices, Reminders, Records upload
  - Admin → show everything

---

### 3. POST /api/auth/forgot-password
**Why:** User forgot their password, needs OTP on email.
**Where:** Login screen → "Forgot password?" link → enter email → submit.
**Who:** Anyone (no token needed).

**Request:**
```json
{
    "email": "amit@doctor.com"
}
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "OTP sent to your email"
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "No account found with this email", "data": null }
```

**Frontend action:** On success → show toast "Check your email" → navigate to OTP input screen.

---

### 4. POST /api/auth/verify-otp
**Why:** Verify the OTP user received on email.
**Where:** OTP screen → 6-digit input → verify button.
**Who:** Anyone (no token needed).

**Request:**
```json
{
    "email": "amit@doctor.com",
    "otp": "482917"
}
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "OTP verified successfully"
}
```

**Errors:**
```json
{ "status": false, "status_code": 400, "message": "Invalid or expired OTP", "data": null }
```

**Frontend action:** On success → navigate to reset password screen. On error → show "Invalid OTP" → let user retry or resend.

---

### 5. POST /api/auth/reset-password
**Why:** Set a new password after OTP verification.
**Where:** Reset password screen → new password + confirm → submit.
**Who:** Anyone (no token needed).

**Request:**
```json
{
    "email": "amit@doctor.com",
    "otp": "482917",
    "new_password": "NewDoctor@123"
}
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Password reset successful"
}
```

**Frontend action:** Show success modal → redirect to login screen.

---

### 6. GET /api/auth/me
**Why:** Get logged-in user's profile.
**Where:** Profile/Settings screen → loads on screen open. Also called on app launch to verify token is still valid.
**Who:** Any logged-in user (token required).

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Profile fetched",
    "data": {
        "id": 2,
        "user_code": "DR0001",
        "first_name": "Amit",
        "last_name": "Sharma",
        "email": "amit@doctor.com",
        "phone": "9876543210",
        "role": "Doctor",
        "platform": "android",
        "device_type": "mobile",
        "last_login_at": "2026-05-20T10:00:00.000Z",
        "created_at": "2026-05-15T08:30:00.000Z"
    }
}
```

**Frontend action:** Display profile info. If 401 → token expired → redirect to login.

---

### 7. POST /api/auth/logout
**Why:** Log out the user, clear refresh token from DB.
**Where:** Settings/Profile screen → "Logout" button.
**Who:** Any logged-in user (token required).

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Logged out successfully"
}
```

**Frontend action:** Clear AsyncStorage (token, user data) → redirect to login screen.

---

## DOCTOR PROFILE ENDPOINTS (4)

---

### 8. GET /api/doctors
**Why:** List all doctors in the clinic.
**Where:** Staff booking appointment → doctor dropdown. Admin user management.
**Who:** Staff, Doctor, Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Doctors fetched",
    "data": [
        {
            "id": 2,
            "user_code": "DR0001",
            "first_name": "Amit",
            "last_name": "Sharma",
            "email": "amit@doctor.com",
            "phone": "9876543210",
            "specialty": "General Physician",
            "experience": "8 years",
            "qualification": "MBBS, MD",
            "profile_photo": null
        },
        {
            "id": 3,
            "user_code": "DR0002",
            "first_name": "Priya",
            "last_name": "Gupta",
            "email": "priya@doctor.com",
            "phone": "9876543211",
            "specialty": "Cardiologist",
            "experience": "12 years",
            "qualification": "MBBS, MD, DM",
            "profile_photo": null
        }
    ]
}
```

**Frontend action:** Use in appointment booking dropdown. Also on "My Doctors" screen showing clinic doctors.

---

### 9. GET /api/doctors/profile
**Why:** Doctor views their own extended profile (specialty, experience, qualification).
**Where:** Doctor opens Profile Settings → shows basic info + professional info.
**Who:** Doctor, Admin only.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Profile fetched",
    "data": {
        "id": 2,
        "user_code": "DR0001",
        "first_name": "Amit",
        "last_name": "Sharma",
        "email": "amit@doctor.com",
        "phone": "9876543210",
        "last_login_at": "2026-05-20T10:00:00.000Z",
        "created_at": "2026-05-15T08:30:00.000Z",
        "specialty": "General Physician",
        "experience": "8 years",
        "qualification": "MBBS, MD",
        "profile_photo": null,
        "updated_at": "2026-05-18T14:00:00.000Z"
    }
}
```

**Frontend action:** If `specialty` is null → show "Complete your profile" prompt → navigate to create profile form.

---

### 10. POST /api/doctors/profile
**Why:** Doctor fills in professional info for the first time.
**Where:** Profile Settings → first time setup → specialty, experience, qualification form → submit.
**Who:** Doctor, Admin only.

**Request:**
```json
{
    "specialty": "General Physician",
    "experience": "8 years",
    "qualification": "MBBS, MD",
    "profile_photo": null
}
```

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Profile created",
    "data": { "id": 1 }
}
```

**Errors:**
```json
{ "status": false, "status_code": 409, "message": "Profile already exists, use PUT to update", "data": null }
```

**Frontend action:** Show toast → refresh profile screen.

---

### 11. PUT /api/doctors/profile
**Why:** Doctor updates their professional info.
**Where:** Profile Settings → edit icon → update form → save.
**Who:** Doctor, Admin only.

**Request:**
```json
{
    "specialty": "Cardiologist",
    "experience": "10 years",
    "qualification": "MBBS, MD, DM Cardiology",
    "profile_photo": null
}
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Profile updated"
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Profile not found, use POST to create first", "data": null }
```

---

## PATIENT ENDPOINTS (7)

---

### 12. POST /api/patients
**Why:** Create a new patient record.
**Where:** Patients screen → "+" button → form (Personal Info, Vitals, Address) → submit.
**Who:** Staff, Doctor, Admin.

**Request:**
```json
{
    "first_name": "Rajesh",
    "last_name": "Verma",
    "email": "rajesh@patient.com",
    "phone": "9988776655",
    "date_of_birth": "1990-05-15",
    "gender": "Male",
    "blood_group": "B+",
    "height_cm": 175,
    "weight_kg": 72,
    "pulse": 78,
    "respiratory_rate": 18,
    "allergies": "Penicillin",
    "past_medical_history": "Appendix surgery in 2018",
    "street_address": "42 MG Road",
    "city": "Patna",
    "state": "Bihar",
    "zip_code": "800001"
}
```

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Patient created",
    "data": {
        "id": 1,
        "patient_code": "PT0001",
        "first_name": "Rajesh",
        "last_name": "Verma",
        "email": "rajesh@patient.com",
        "phone": "9988776655"
    }
}
```

**Frontend action:** Show success toast "Patient created — PT0001" → navigate to patient profile screen.

---

### 13. GET /api/patients
**Why:** Get list of all patients.
**Where:** Patients screen → loads on screen open.
**Who:** Staff, Doctor, Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Patients fetched",
    "data": [
        {
            "id": 1,
            "patient_code": "PT0001",
            "first_name": "Rajesh",
            "last_name": "Verma",
            "email": "rajesh@patient.com",
            "phone": "9988776655",
            "gender": "Male",
            "date_of_birth": "1990-05-15",
            "blood_group": "B+",
            "city": "Patna",
            "created_at": "2026-05-20T08:00:00.000Z"
        }
    ]
}
```

**Frontend action:** Render patient cards. Tap card → navigate to patient profile.

---

### 14. GET /api/patients/:id
**Why:** Get full profile of one patient.
**Where:** Patient profile screen → loads when user taps a patient card.
**Who:** Staff, Doctor, Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Patient fetched",
    "data": {
        "id": 1,
        "patient_code": "PT0001",
        "first_name": "Rajesh",
        "last_name": "Verma",
        "email": "rajesh@patient.com",
        "phone": "9988776655",
        "date_of_birth": "1990-05-15",
        "gender": "Male",
        "blood_group": "B+",
        "height_cm": 175,
        "weight_kg": 72,
        "pulse": 78,
        "respiratory_rate": 18,
        "allergies": "Penicillin",
        "past_medical_history": "Appendix surgery in 2018",
        "street_address": "42 MG Road",
        "city": "Patna",
        "state": "Bihar",
        "zip_code": "800001",
        "created_at": "2026-05-20T08:00:00.000Z",
        "created_by": "Rahul Kumar"
    }
}
```

**Frontend action:** Show full profile. Also load all tabs using patient_id:
```
GET /api/prescriptions?patient_id=1
GET /api/certificates?patient_id=1
GET /api/records?patient_id=1
GET /api/invoices?patient_id=1
GET /api/reminders?patient_id=1
GET /api/appointments?patient_id=1
```

---

### 15. PUT /api/patients/:id
**Why:** Update patient's info.
**Where:** Patient profile → edit icon → edit form → save.
**Who:** Staff, Admin only.

**Request:** Same shape as POST /api/patients.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Patient updated" }
```

---

### 16. DELETE /api/patients/:id
**Why:** Soft delete a patient.
**Where:** Patient profile → "..." menu → "Delete patient" → confirm.
**Who:** Staff, Admin only.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Patient deleted" }
```

---

### 17. GET /api/patients/search?q=
**Why:** Search patients by name, phone, email, patient_code, or city.
**Where:** Patients screen → search bar → user types → results update live.
**Who:** Staff, Doctor, Admin.

**Example:** `GET /api/patients/search?q=rajesh`

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Search results",
    "data": [
        {
            "id": 1,
            "patient_code": "PT0001",
            "first_name": "Rajesh",
            "last_name": "Verma",
            "email": "rajesh@patient.com",
            "phone": "9988776655",
            "city": "Patna"
        }
    ]
}
```

**Frontend action:** Debounce 300ms → call on each keystroke → render filtered cards.

---

### 18. GET /api/patients/:id/timeline
**Why:** Get all events for a patient in date order.
**Where:** Patient profile → "Timeline" tab.
**Who:** Staff, Doctor, Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Timeline fetched",
    "data": [
        { "type": "appointment", "id": 1, "created_at": "2026-05-20T10:00:00.000Z", "extra": "Confirmed" },
        { "type": "prescription", "id": 1, "created_at": "2026-05-20T10:30:00.000Z", "extra": "Viral fever" },
        { "type": "record", "id": 1, "created_at": "2026-05-22T14:00:00.000Z", "extra": "Lab Report" },
        { "type": "reminder", "id": 1, "created_at": "2026-05-20T11:00:00.000Z", "extra": "Follow up call" }
    ]
}
```

**Frontend action:** Render vertical timeline. Tap item → navigate to detail screen.

---

## APPOINTMENT ENDPOINTS (6)

---

### 19. POST /api/appointments
**Why:** Book an appointment for a patient with a doctor.
**Where:** Appointments screen → "+" button → select patient, doctor, date, reason → submit.
**Who:** Staff, Admin only.

**Request:**
```json
{
    "patient_id": 1,
    "doctor_id": 2,
    "appointment_date": "2026-05-20 10:00:00",
    "reason": "Fever and headache",
    "notes": "Patient complaining since 3 days"
}
```

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Appointment created",
    "data": { "id": 1 }
}
```

**Frontend action:** For doctor_id dropdown → fetch from `GET /api/doctors`.

---

### 20. GET /api/appointments
**Why:** Get appointments. Supports optional filters.
**Where:** Appointments screen. Also inside patient profile (Appointments tab).
**Who:** Staff sees all. Doctor sees own only. Admin sees all.

**Variants:**
```
GET /api/appointments                    → all (Staff/Admin) or own (Doctor)
GET /api/appointments?patient_id=1       → only PT0001's appointments
GET /api/appointments?doctor_id=2        → only DR0001's appointments
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Appointments fetched",
    "data": [
        {
            "id": 1,
            "appointment_date": "2026-05-20T10:00:00.000Z",
            "reason": "Fever and headache",
            "status": "Confirmed",
            "patient_name": "Rajesh Verma",
            "patient_code": "PT0001",
            "doctor_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "created_at": "2026-05-19T08:00:00.000Z"
        }
    ]
}
```

**Frontend action:** Render cards with status color: Pending=amber, Confirmed=blue, Completed=green, Cancelled=red.

---

### 21. GET /api/appointments/:id
**Why:** Get single appointment detail.
**Where:** Tap on appointment card → detail screen.
**Who:** Staff, Doctor (own only), Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Appointment fetched",
    "data": {
        "id": 1,
        "appointment_date": "2026-05-20T10:00:00.000Z",
        "reason": "Fever and headache",
        "notes": "Patient complaining since 3 days",
        "status": "Confirmed",
        "patient_name": "Rajesh Verma",
        "patient_code": "PT0001",
        "doctor_name": "Amit Sharma",
        "doctor_code": "DR0001",
        "booked_by_name": "Rahul Kumar",
        "created_at": "2026-05-19T08:00:00.000Z"
    }
}
```

---

### 22. PUT /api/appointments/:id
**Why:** Update appointment details.
**Who:** Staff, Admin only.

**Request:**
```json
{
    "appointment_date": "2026-05-21 11:00:00",
    "reason": "Updated reason",
    "notes": "Updated notes"
}
```

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Appointment updated" }
```

---

### 23. PATCH /api/appointments/:id/status
**Why:** Change only the status.
**Where:** Appointment card → status dropdown.
**Who:** Staff, Admin only.

**Request:**
```json
{ "status": "Confirmed" }
```
Valid: `Pending`, `Confirmed`, `Completed`, `Cancelled`

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Status updated" }
```

---

### 24. DELETE /api/appointments/:id
**Why:** Soft delete an appointment.
**Who:** Staff, Admin only.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Appointment deleted" }
```

---

## PRESCRIPTION ENDPOINTS (10)

---

### 25. POST /api/prescriptions
**Why:** Doctor creates a new prescription for a patient.
**Where:** Patient profile → "New Prescription" button → form → save.
**Who:** Doctor, Admin only.

**Request:**
```json
{
    "patient_id": 1,
    "appointment_id": 1,
    "diagnosis": "Viral fever with mild dehydration",
    "notes": "Advised rest for 5 days"
}
```

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Prescription created",
    "data": { "id": 1 }
}
```

**Frontend action:** On success → navigate to prescription detail → show "Add Medicines" and "Add Lab Tests" buttons.

---

### 26. GET /api/prescriptions
**Why:** Get prescriptions. Supports optional filters.
**Where:** Patient profile → Prescriptions tab. Also standalone prescriptions screen.
**Who:** Doctor sees own only. Staff reads all. Admin reads all.

**Variants:**
```
GET /api/prescriptions                    → all (Staff/Admin) or own (Doctor)
GET /api/prescriptions?patient_id=1       → only PT0001's prescriptions
GET /api/prescriptions?doctor_id=2        → only DR0001's prescriptions
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Prescriptions fetched",
    "data": [
        {
            "id": 1,
            "diagnosis": "Viral fever with mild dehydration",
            "notes": "Advised rest for 5 days",
            "created_at": "2026-05-20T10:30:00.000Z",
            "doctor_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "patient_name": "Rajesh Verma",
            "patient_code": "PT0001"
        }
    ]
}
```

**Frontend action:** Inside patient profile → auto-attach `?patient_id=${patientId}`. Staff sees all doctors. Doctor auto-sees own only.

---

### 27. GET /api/prescriptions/:id
**Why:** Get full prescription with medicines and lab tests.
**Where:** Tap on prescription card → detail screen.
**Who:** Doctor (own only), Staff (read only), Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Prescription fetched",
    "data": {
        "id": 1,
        "diagnosis": "Viral fever with mild dehydration",
        "notes": "Advised rest for 5 days",
        "created_at": "2026-05-20T10:30:00.000Z",
        "doctor_name": "Amit Sharma",
        "doctor_code": "DR0001",
        "patient_name": "Rajesh Verma",
        "patient_code": "PT0001",
        "medicines": [
            {
                "id": 1,
                "name": "Paracetamol",
                "dosage": "500mg",
                "frequency": "Twice a day",
                "duration": "5 days",
                "instructions": "Take after meals"
            }
        ],
        "lab_tests": [
            {
                "id": 1,
                "test_name": "CBC (Complete Blood Count)",
                "notes": "Check for infection markers"
            }
        ]
    }
}
```

**Frontend action:** Doctor sees edit/delete buttons. Staff sees read-only.

---

### 28. PUT /api/prescriptions/:id
**Why:** Update diagnosis or notes.
**Who:** Doctor (own only), Admin. Ownership checked.

**Request:**
```json
{ "diagnosis": "Updated diagnosis", "notes": "Updated notes" }
```

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Prescription updated" }
```

---

### 29. DELETE /api/prescriptions/:id
**Who:** Doctor (own only), Admin.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Prescription deleted" }
```

---

### 30. POST /api/prescriptions/:id/medicines
**Why:** Add a medicine to a prescription.
**Where:** Prescription detail → "Add Medicine" button → form → save.
**Who:** Doctor (own only), Admin.

**Request:**
```json
{
    "name": "Paracetamol",
    "dosage": "500mg",
    "frequency": "Twice a day",
    "duration": "5 days",
    "instructions": "Take after meals"
}
```

**Success — 201:**
```json
{ "status": true, "status_code": 201, "message": "Medicine added", "data": { "id": 1 } }
```

---

### 31. PUT /api/prescriptions/:id/medicines/:medicineId
**Why:** Update a specific medicine.
**Who:** Doctor (own only), Admin.

**Request:**
```json
{
    "name": "Paracetamol",
    "dosage": "650mg",
    "frequency": "Three times a day",
    "duration": "5 days",
    "instructions": "Take after meals with warm water"
}
```

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Medicine updated" }
```

---

### 32. DELETE /api/prescriptions/:id/medicines/:medicineId
**Who:** Doctor (own only), Admin.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Medicine deleted" }
```

---

### 33. POST /api/prescriptions/:id/lab-tests
**Why:** Add a lab test to a prescription.
**Who:** Doctor (own only), Admin.

**Request:**
```json
{
    "test_name": "CBC (Complete Blood Count)",
    "notes": "Check for infection markers"
}
```

**Success — 201:**
```json
{ "status": true, "status_code": 201, "message": "Lab test added", "data": { "id": 1 } }
```

---

### 34. DELETE /api/prescriptions/:id/lab-tests/:labTestId
**Who:** Doctor (own only), Admin.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Lab test deleted" }
```

---

## TEMPLATE ENDPOINTS (5)

---

### 35. POST /api/templates
**Why:** Doctor saves a reusable template.
**Where:** Templates screen → "Create Template" → form → save.
**Who:** Doctor, Admin only. Staff blocked.

**Request:**
```json
{
    "type": "Prescription",
    "title": "Common Fever Template",
    "content": "{\"diagnosis\":\"Viral fever\",\"medicines\":[{\"name\":\"Paracetamol\",\"dosage\":\"500mg\"}]}"
}
```
Valid types: `Prescription`, `Certificate`, `General`

**Success — 201:**
```json
{ "status": true, "status_code": 201, "message": "Template created", "data": { "id": 1 } }
```

**Frontend action:** On "New Prescription" form → "Load Template" button → picks template → form auto-fills.

---

### 36. GET /api/templates
**Why:** Get all templates from all doctors (shared read).
**Where:** Templates screen. Also dropdown when creating prescription.
**Who:** Doctor, Admin only. Staff blocked.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Templates fetched",
    "data": [
        {
            "id": 1,
            "type": "Prescription",
            "title": "Common Fever Template",
            "content": "{...}",
            "created_at": "2026-05-18T08:00:00.000Z",
            "created_by_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "created_by": 2
        }
    ]
}
```

**Frontend action:** Show edit/delete buttons ONLY if `created_by === loggedInUser.id`.

---

### 37. GET /api/templates/:id
**Who:** Doctor, Admin.

---

### 38. PUT /api/templates/:id
**Who:** Doctor (own only), Admin. Ownership checked.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Template updated" }
```

---

### 39. DELETE /api/templates/:id
**Who:** Doctor (own only), Admin. Ownership checked.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Template deleted" }
```

---

## RECORD & UPLOAD ENDPOINTS (6)

---

### 40. POST /api/records
**Why:** Upload a file attached to a patient.
**Where:** Patient profile → Records → "Upload" → pick type, title, file → upload.
**Who:** Staff, Doctor, Admin.

**IMPORTANT — Role-based file types:**
- **Doctor dropdown:** `Prescription`, `Certificate`
- **Staff dropdown:** `Lab Report`, `X-Ray`, `MRI`, `CT Scan`, `Invoice`, `Insurance Document`, `Consent Form`, `General Medical Record`
- **Admin dropdown:** all 10 types

**Request (form-data, NOT JSON):**
```
Key: patient_id     | Value: 1            | Type: Text
Key: file_type      | Value: Lab Report   | Type: Text
Key: title          | Value: CBC Test     | Type: Text
Key: notes          | Value: Post fever   | Type: Text
Key: file           | Value: [select file] | Type: File
```

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Record created",
    "data": { "id": 1, "file_url": "/uploads/1716206253-339733008.pdf" }
}
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "Staff cannot upload this record type", "data": null }
{ "status": false, "status_code": 403, "message": "Doctor cannot upload this record type", "data": null }
```

---

### 41. GET /api/records
**Why:** Get all records for a patient.
**Where:** Patient profile → Records tab.
**Who:** Staff, Doctor, Admin.

**Variants:**
```
GET /api/records?patient_id=1    → PT0001's records
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Records fetched",
    "data": [
        {
            "id": 1,
            "file_url": "/uploads/1716206253.pdf",
            "file_name": "CBC_report.pdf",
            "file_size": 245,
            "file_type": "Lab Report",
            "title": "CBC Blood Test",
            "notes": "Post fever test",
            "created_at": "2026-05-22T14:00:00.000Z",
            "uploaded_by_name": "Rahul Kumar"
        }
    ]
}
```

**Frontend action:** Display file → `${BASE_URL}${file_url}`. `file_size` is in KB.

---

### 42. GET /api/records/:id
**Why:** Get single record detail.
**Who:** Staff, Doctor, Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Record fetched",
    "data": {
        "id": 1,
        "file_url": "/uploads/1716206253.pdf",
        "file_name": "CBC_report.pdf",
        "file_size": 245,
        "file_type": "Lab Report",
        "title": "CBC Blood Test May 2026",
        "notes": "Post fever blood test",
        "created_at": "2026-05-22T14:00:00.000Z",
        "uploaded_by_name": "Rahul Kumar",
        "patient_name": "Rajesh Verma",
        "patient_code": "PT0001"
    }
}
```

---

### 43. DELETE /api/records/:id
**Who:** Staff, Admin only. Doctor cannot delete records.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Record deleted" }
```

---

### 44. POST /api/records/upload/single
**Why:** Upload a single file (without patient record attachment).
**Who:** Staff, Doctor, Admin.

**Request (form-data):** `Key: file | Type: File`

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "File uploaded",
    "data": { "file_url": "/uploads/file.png", "file_name": "xray.png", "file_size": 1024 }
}
```

---

### 45. POST /api/records/upload/multiple
**Why:** Upload multiple files at once.
**Who:** Staff, Doctor, Admin.

**Request (form-data):** `Key: files | Type: File (multiple)`

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Files uploaded",
    "data": [
        { "file_url": "/uploads/file1.pdf", "file_name": "report.pdf", "file_size": 512 },
        { "file_url": "/uploads/file2.png", "file_name": "xray.png", "file_size": 1024 }
    ]
}
```

---

## REMINDER ENDPOINTS (4)

---

### 46. POST /api/reminders
**Why:** Staff creates a follow-up reminder for a patient.
**Where:** Reminders screen → "+" button → form → save.
**Who:** Staff, Admin only. Doctor blocked.

**Request:**
```json
{
    "patient_id": 1,
    "title": "Post fever follow-up call",
    "description": "Call patient to check recovery",
    "remind_at": "2026-05-25 10:00:00"
}
```

**Success — 201:**
```json
{ "status": true, "status_code": 201, "message": "Reminder created", "data": { "id": 1 } }
```

---

### 47. GET /api/reminders
**Why:** Get reminders. Supports optional patient filter.
**Where:** Reminders screen. Also patient profile → Reminders tab.
**Who:** Staff, Admin only.

**Variants:**
```
GET /api/reminders                    → all reminders
GET /api/reminders?patient_id=1       → only PT0001's reminders
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Reminders fetched",
    "data": [
        {
            "id": 1,
            "title": "Post fever follow-up call",
            "description": "Call patient to check recovery",
            "remind_at": "2026-05-25T10:00:00.000Z",
            "is_done": false,
            "created_at": "2026-05-20T11:00:00.000Z",
            "patient_name": "Rajesh Verma",
            "patient_code": "PT0001",
            "created_by_name": "Rahul Kumar"
        }
    ]
}
```

**Frontend action:** Overdue (remind_at < now && !is_done) → highlight red.

---

### 48. PUT /api/reminders/:id
**Why:** Update reminder or mark as done.
**Who:** Staff, Admin only.

**Request:**
```json
{
    "title": "Post fever follow-up call",
    "description": "Call patient to check recovery",
    "remind_at": "2026-05-25 10:00:00",
    "is_done": true
}
```

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Reminder updated" }
```

---

### 49. DELETE /api/reminders/:id
**Who:** Staff, Admin only.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Reminder deleted" }
```

---

## INVOICE ENDPOINTS (4)

---

### 50. POST /api/invoices
**Why:** Staff creates a bill for a patient.
**Where:** Patient profile → "Create Invoice" → form → save.
**Who:** Staff, Admin only. Doctor blocked.

**Request:**
```json
{
    "patient_id": 1,
    "total_amount": 1500.00,
    "description": "Consultation ₹500 + Lab Tests ₹1000",
    "notes": "Fever treatment - Dr. Amit"
}
```

**Success — 201:**
```json
{ "status": true, "status_code": 201, "message": "Invoice created", "data": { "id": 1 } }
```

---

### 51. GET /api/invoices
**Why:** Get invoices. Supports optional patient filter.
**Where:** Invoices screen. Also patient profile → Invoices tab.
**Who:** Staff, Admin only.

**Variants:**
```
GET /api/invoices                    → all invoices
GET /api/invoices?patient_id=1       → only PT0001's invoices
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Invoices fetched",
    "data": [
        {
            "id": 1,
            "total_amount": "1500.00",
            "status": "Paid",
            "description": "Consultation + Lab Tests",
            "created_at": "2026-05-20T12:00:00.000Z",
            "patient_name": "Rajesh Verma",
            "patient_code": "PT0001",
            "created_by_name": "Rahul Kumar"
        }
    ]
}
```

**Frontend action:** Status badges: Unpaid=red, Paid=green, Cancelled=gray.

---

### 52. GET /api/invoices/:id
**Who:** Staff, Admin.

---

### 53. PATCH /api/invoices/:id/status
**Why:** Update payment status.
**Where:** Invoice detail → "Mark as Paid" button.
**Who:** Staff, Admin.

**Request:**
```json
{ "status": "Paid" }
```
Valid: `Unpaid`, `Paid`, `Cancelled`

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Invoice status updated" }
```

---

## CERTIFICATE ENDPOINTS (5)

---

### 54. POST /api/certificates
**Why:** Doctor creates a medical certificate.
**Where:** Patient profile → "New Certificate" → form → save.
**Who:** Doctor, Admin only.

**Request:**
```json
{
    "patient_id": 1,
    "title": "Sick Leave Certificate",
    "content": "This is to certify that Rajesh Verma was examined on 20th May 2026 and is advised rest for 5 days.",
    "valid_until": "2026-05-25"
}
```

**Success — 201:**
```json
{ "status": true, "status_code": 201, "message": "Certificate created", "data": { "id": 1 } }
```

---

### 55. GET /api/certificates
**Why:** Get certificates. Supports optional filters.
**Where:** Certificates screen. Also patient profile → Certificates tab.
**Who:** Doctor (own only), Staff (read all), Admin (read all).

**Variants:**
```
GET /api/certificates                    → all (Staff/Admin) or own (Doctor)
GET /api/certificates?patient_id=1       → only PT0001's certificates
GET /api/certificates?doctor_id=2        → only DR0001's certificates
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Certificates fetched",
    "data": [
        {
            "id": 1,
            "title": "Sick Leave Certificate",
            "valid_until": "2026-05-25",
            "created_at": "2026-05-20T10:45:00.000Z",
            "patient_name": "Rajesh Verma",
            "patient_code": "PT0001",
            "doctor_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "doctor_id": 2
        }
    ]
}
```

**Frontend action:** Staff sees all. Doctor sees own only. Edit/delete buttons only if `doctor_id === loggedInUser.id`.

---

### 56. GET /api/certificates/:id
**Who:** Doctor (own only), Staff (read), Admin.

---

### 57. PUT /api/certificates/:id
**Who:** Doctor (own only), Admin. Ownership checked.

---

### 58. DELETE /api/certificates/:id
**Who:** Doctor (own only), Admin. Ownership checked.

---

## NOTIFICATION ENDPOINTS (3)

---

### 59. GET /api/notifications
**Why:** Get all notifications for logged-in user + unread count.
**Where:** Bell icon → notification panel.
**Who:** Any logged-in user. Each user sees only their own.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Notifications fetched",
    "data": {
        "unread_count": 3,
        "notifications": [
            {
                "id": 1,
                "title": "Appointment Completed",
                "message": "Dr. Amit completed appointment for PT0001",
                "type": "Appointment",
                "is_read": false,
                "created_at": "2026-05-20T15:00:00.000Z"
            }
        ]
    }
}
```

**Frontend action:** `unread_count` → red badge on bell icon. Tap → mark as read + navigate based on `type`.

---

### 60. PATCH /api/notifications/:id/read
**Who:** Any logged-in user (own only).

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Notification marked as read" }
```

---

### 61. DELETE /api/notifications/:id
**Who:** Any logged-in user (own only).

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Notification deleted" }
```

---

## SEARCH ENDPOINTS (5)

---

### 62. GET /api/search/global?q=
**Why:** Search across patients, prescriptions, invoices, records.
**Where:** Top-level search bar.
**Who:** Any logged-in user.

**Example:** `GET /api/search/global?q=rajesh`

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Search results",
    "data": [
        { "category": "patient", "id": 1, "label": "Rajesh Verma", "detail": "PT0001" },
        { "category": "prescription", "id": 1, "label": "Viral fever", "detail": "Rest 5 days" }
    ]
}
```

**Frontend action:** Group by `category`. Tap → navigate to detail.

---

### 63. GET /api/search/patients?q=
**Where:** Patient list search bar.

### 64. GET /api/search/prescriptions?q=
**Where:** Prescriptions search bar.

### 65. GET /api/search/invoices?q=
**Where:** Invoices search bar. Doctor blocked.

### 66. GET /api/search/records?q=
**Where:** Records search bar.

---

## DASHBOARD ENDPOINT (1)

---

### 67. GET /api/dashboard
**Why:** Summary stats and today's appointments.
**Where:** Home screen → loads on app open.
**Who:** Admin sees all. Doctor sees own appointments. Staff sees all.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Dashboard data",
    "data": {
        "stats": {
            "total_patients": 247,
            "total_doctors": 5,
            "total_staff": 8,
            "total_appointments": 1250,
            "pending_appointments": 3,
            "unpaid_invoices": 12,
            "total_revenue": 45000
        },
        "today_appointments": [
            {
                "id": 1,
                "appointment_date": "2026-05-20T10:00:00.000Z",
                "reason": "Fever",
                "status": "Confirmed",
                "patient_name": "Rajesh Verma",
                "patient_code": "PT0001",
                "doctor_name": "Amit Sharma",
                "doctor_code": "DR0001"
            }
        ]
    }
}
```

**Frontend action:** Stats → 4 metric cards. `total_revenue` → format ₹45,000.

---

## PATIENT PROFILE — ALL API CALLS

When user taps a patient card, frontend loads everything:

```javascript
const patientId = patient.id;

const [patient, prescriptions, certificates, records, invoices, reminders, appointments, timeline] = await Promise.all([
    axios.get(`/api/patients/${patientId}`),
    axios.get(`/api/prescriptions?patient_id=${patientId}`),
    axios.get(`/api/certificates?patient_id=${patientId}`),
    axios.get(`/api/records?patient_id=${patientId}`),
    axios.get(`/api/invoices?patient_id=${patientId}`),
    axios.get(`/api/reminders?patient_id=${patientId}`),
    axios.get(`/api/appointments?patient_id=${patientId}`),
    axios.get(`/api/patients/${patientId}/timeline`),
]);
```

---

## ROLE-BASED UI RENDERING

```javascript
// After login, use user.role everywhere:

// Menu items
const showReminders  = ['Staff', 'Admin'].includes(user.role);
const showInvoices   = ['Staff', 'Admin'].includes(user.role);
const showTemplates  = ['Doctor', 'Admin'].includes(user.role);

// Buttons inside patient profile
const canEditPatient        = ['Staff', 'Admin'].includes(user.role);
const canCreatePrescription = ['Doctor', 'Admin'].includes(user.role);
const canCreateCertificate  = ['Doctor', 'Admin'].includes(user.role);
const canCreateInvoice      = ['Staff', 'Admin'].includes(user.role);
const canCreateReminder     = ['Staff', 'Admin'].includes(user.role);
const canDeleteRecord       = ['Staff', 'Admin'].includes(user.role);

// Ownership check for edit/delete
const canEditPrescription = user.role === 'Doctor' && prescription.doctor_id === user.id;
const canEditTemplate     = template.created_by === user.id;
const canEditCertificate  = user.role === 'Doctor' && certificate.doctor_id === user.id;

// Record upload types
const DOCTOR_FILE_TYPES = ['Prescription', 'Certificate'];
const STAFF_FILE_TYPES  = ['Lab Report', 'X-Ray', 'MRI', 'CT Scan', 'Invoice', 'Insurance Document', 'Consent Form', 'General Medical Record'];
const fileTypes = user.role === 'Doctor' ? DOCTOR_FILE_TYPES : user.role === 'Staff' ? STAFF_FILE_TYPES : [...DOCTOR_FILE_TYPES, ...STAFF_FILE_TYPES];
```

---

## COMMON ERROR CODES

| Code | Meaning | Frontend Action |
|------|---------|----------------|
| 200 | Success | Show green toast |
| 201 | Created | Show green toast + redirect |
| 400 | Bad request | Show error modal with message |
| 401 | Not authenticated | Clear token → redirect to login |
| 403 | Access denied | Show error modal "You don't have permission" |
| 404 | Not found | Show error modal with message |
| 409 | Conflict (duplicate) | Show error modal with message |
| 500 | Server error | Show error modal "Something went wrong" |

---

## ENDPOINT SUMMARY

| Module | Endpoints | Numbers |
|--------|-----------|---------|
| Auth | 7 | #1 — #7 |
| Doctor Profile | 4 | #8 — #11 |
| Patient | 7 | #12 — #18 |
| Appointment | 6 | #19 — #24 |
| Prescription | 10 | #25 — #34 |
| Template | 5 | #35 — #39 |
| Record & Upload | 6 | #40 — #45 |
| Reminder | 4 | #46 — #49 |
| Invoice | 4 | #50 — #53 |
| Certificate | 5 | #54 — #58 |
| Notification | 3 | #59 — #61 |
| Search | 5 | #62 — #66 |
| Dashboard | 1 | #67 |
| **Total** | **67** | |

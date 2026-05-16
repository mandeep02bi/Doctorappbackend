# Medical App — API Documentation for Frontend

**Base URL:** `http://localhost:5000/api`

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

## AUTH ENDPOINTS

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
// Role = Admin
{ "status": false, "status_code": 403, "message": "Admin registration is not allowed", "data": null }

// Email already exists
{ "status": false, "status_code": 409, "message": "Email already registered", "data": null }

// Invalid role
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

## PATIENT ENDPOINTS

---

### 8. POST /api/patients
**Why:** Create a new patient record.
**Where:** Patients screen → "+" button → 3-step form (Personal Info → Vitals → Address) → submit.
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

### 9. GET /api/patients
**Why:** Get list of all patients.
**Where:** Patients screen → loads on screen open. Shows patient cards list.
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
        },
        {
            "id": 2,
            "patient_code": "PT0002",
            "first_name": "Anita",
            "last_name": "Singh",
            "phone": "9988776644",
            "gender": "Female",
            "blood_group": "O+",
            "city": "Patna",
            "created_at": "2026-05-20T09:00:00.000Z"
        }
    ]
}
```

**Frontend action:** Render patient cards list. Each card shows initials avatar, name, patient_code, gender, age, blood group, city. Tap card → navigate to patient profile.

---

### 10. GET /api/patients/:id
**Why:** Get full profile of one patient.
**Where:** Patient profile screen → loads when user taps a patient card.
**Who:** Staff, Doctor, Admin.

**Example:** `GET /api/patients/1`

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

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**Frontend action:** Show full patient profile — header (name, code, gender, age, blood group), vitals grid (height, weight, pulse, respiratory rate), details section (phone, email, allergies, address), quick action buttons (prescriptions, certificates, invoices, records).

---

### 11. PUT /api/patients/:id
**Why:** Update patient's info.
**Where:** Patient profile screen → edit icon → edit form → save.
**Who:** Staff, Admin only.

**Request:** Same shape as POST /api/patients (send all fields).

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Patient updated"
}
```

**Frontend action:** Show toast → refresh patient profile.

---

### 12. DELETE /api/patients/:id
**Why:** Soft delete a patient.
**Where:** Patient profile screen → "..." menu → "Delete patient" → confirm dialog.
**Who:** Staff, Admin only.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Patient deleted"
}
```

**Frontend action:** Show toast → navigate back to patients list → refresh list.

---

### 13. GET /api/patients/search?q=
**Why:** Search patients by name, phone, email, patient_code, or city.
**Where:** Patients screen → search bar at top → user types → results update live.
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

**Frontend action:** Debounce 300ms → call API on each keystroke → render filtered patient cards. If `data` is empty array → show "No patients found".

---

### 14. GET /api/patients/:id/timeline
**Why:** Get all events for a patient in chronological order — appointments, prescriptions, records, reminders.
**Where:** Patient profile screen → "Timeline" tab.
**Who:** Staff, Doctor, Admin.

**Example:** `GET /api/patients/1/timeline`

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

**Frontend action:** Render vertical timeline with icons per type:
- appointment → calendar icon
- prescription → stethoscope icon
- record → file icon
- reminder → bell icon

Tap any item → navigate to its detail screen.

---

## APPOINTMENT ENDPOINTS

---

### 15. POST /api/appointments
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

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
{ "status": false, "status_code": 404, "message": "Doctor not found", "data": null }
```

**Frontend action:** Show toast → navigate to appointments list. For patient_id and doctor_id → use dropdowns that fetch from GET /api/patients and GET /api/users?role=Doctor.

---

### 16. GET /api/appointments
**Why:** Get all appointments.
**Where:** Appointments screen → loads on screen open.
**Who:** Staff sees all. Doctor sees own only. Admin sees all.

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

**Frontend action:** Render appointment cards with left color border based on status:
- Pending → amber
- Confirmed → blue
- Completed → green
- Cancelled → red

---

### 17. GET /api/appointments/:id
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

### 18. PUT /api/appointments/:id
**Why:** Update appointment details.
**Where:** Appointment detail → edit icon → edit form → save.
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

### 19. PATCH /api/appointments/:id/status
**Why:** Change only the status of an appointment.
**Where:** Appointment card → status dropdown/buttons (Pending → Confirmed → Completed).
**Who:** Staff, Admin only.

**Request:**
```json
{
    "status": "Confirmed"
}
```
Valid values: `Pending`, `Confirmed`, `Completed`, `Cancelled`

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Status updated" }
```

**Errors:**
```json
{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }
```

**Frontend action:** Update the status badge color immediately → show toast.

---

### 20. DELETE /api/appointments/:id
**Why:** Soft delete an appointment.
**Where:** Appointment detail → "..." menu → "Delete" → confirm.
**Who:** Staff, Admin only.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Appointment deleted" }
```

---

## PRESCRIPTION ENDPOINTS

---

### 21. POST /api/prescriptions
**Why:** Doctor creates a new prescription for a patient.
**Where:** Patient profile → "New Prescription" button → prescription form → save.
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

### 22. GET /api/prescriptions/:id
**Why:** Get full prescription with medicines and lab tests.
**Where:** Tap on prescription card → prescription detail screen.
**Who:** Doctor (own only), Staff (read only), Admin.

**Example:** `GET /api/prescriptions/1`

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
            },
            {
                "id": 2,
                "name": "Cetirizine",
                "dosage": "10mg",
                "frequency": "Once a day",
                "duration": "3 days",
                "instructions": "Take before sleep"
            }
        ],
        "lab_tests": [
            {
                "id": 1,
                "test_name": "CBC (Complete Blood Count)",
                "notes": "Check for infection markers"
            },
            {
                "id": 2,
                "test_name": "Dengue NS1 Antigen",
                "notes": "Rule out dengue"
            }
        ]
    }
}
```

**Frontend action:**
- Show prescription header (patient info, doctor info, diagnosis box)
- Render medicines list with dosage pill, frequency, duration, instructions
- Render lab tests list
- Doctor sees edit/delete buttons. Staff sees read-only view.
- Show "Download PDF" button at bottom (Phase 2).

---

### 23. PUT /api/prescriptions/:id
**Why:** Update diagnosis or notes.
**Where:** Prescription detail → edit icon → edit form → save.
**Who:** Doctor (own only), Admin. Ownership checked.

**Request:**
```json
{
    "diagnosis": "Updated diagnosis",
    "notes": "Updated notes"
}
```

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Prescription updated" }
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

---

### 24. DELETE /api/prescriptions/:id
**Why:** Soft delete a prescription.
**Who:** Doctor (own only), Admin. Ownership checked.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Prescription deleted" }
```

---

### 25. POST /api/prescriptions/:id/medicines
**Why:** Add a medicine to an existing prescription.
**Where:** Prescription detail → "Add Medicine" button → medicine form → save.
**Who:** Doctor (own only), Admin. Ownership checked.

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
{
    "status": true,
    "status_code": 201,
    "message": "Medicine added",
    "data": { "id": 1 }
}
```

**Frontend action:** Append new medicine card to medicines list → show toast.

---

### 26. PUT /api/prescriptions/:id/medicines/:medicineId
**Why:** Update a specific medicine inside a prescription.
**Where:** Medicine card → edit icon → edit form → save.
**Who:** Doctor (own only), Admin.

**Example:** `PUT /api/prescriptions/1/medicines/1`

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

### 27. DELETE /api/prescriptions/:id/medicines/:medicineId
**Why:** Remove a medicine from prescription.
**Where:** Medicine card → delete icon → confirm.
**Who:** Doctor (own only), Admin.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Medicine deleted" }
```

---

### 28. POST /api/prescriptions/:id/lab-tests
**Why:** Add a lab test to an existing prescription.
**Where:** Prescription detail → "Add Lab Test" button → form → save.
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
{
    "status": true,
    "status_code": 201,
    "message": "Lab test added",
    "data": { "id": 1 }
}
```

---

### 29. DELETE /api/prescriptions/:id/lab-tests/:labTestId
**Why:** Remove a lab test from prescription.
**Who:** Doctor (own only), Admin.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Lab test deleted" }
```

---

## TEMPLATE ENDPOINTS

---

### 30. POST /api/templates
**Why:** Doctor saves a reusable prescription or certificate template.
**Where:** Templates screen → "Create Template" → form (type, title, content JSON) → save.
**Who:** Doctor, Admin only. Staff blocked.

**Request:**
```json
{
    "type": "Prescription",
    "title": "Common Fever Template",
    "content": "{\"diagnosis\":\"Viral fever\",\"medicines\":[{\"name\":\"Paracetamol\",\"dosage\":\"500mg\",\"frequency\":\"Twice a day\",\"duration\":\"5 days\"},{\"name\":\"Cetirizine\",\"dosage\":\"10mg\",\"frequency\":\"Once a day\",\"duration\":\"3 days\"}]}"
}
```
Valid types: `Prescription`, `Certificate`, `General`

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Template created",
    "data": { "id": 1 }
}
```

**Frontend action:** On "New Prescription" form → show "Load Template" button → opens template list → user picks one → form auto-fills from template's JSON content.

---

### 31. GET /api/templates
**Why:** Get all templates from all doctors (shared read).
**Where:** Templates screen → list. Also shown as dropdown when creating new prescription.
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

**Frontend action:** Show template cards. Show edit/delete buttons ONLY if `created_by === loggedInUser.id`.

---

### 32. GET /api/templates/:id
**Why:** Get single template detail.
**Who:** Doctor, Admin.

---

### 33. PUT /api/templates/:id
**Why:** Update own template.
**Who:** Doctor (own only), Admin. Ownership checked.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Template updated" }
```

---

### 34. DELETE /api/templates/:id
**Why:** Soft delete own template.
**Who:** Doctor (own only), Admin. Ownership checked.

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Template deleted" }
```

---

## RECORD & UPLOAD ENDPOINTS

---

### 35. POST /api/records
**Why:** Upload a document/file attached to a patient.
**Where:** Patient profile → "Records" → "Upload" button → pick file type, title, select file → upload.
**Who:** Staff, Doctor, Admin. Staff CANNOT upload type "Prescription" or "Certificate".

**Request (form-data, NOT JSON):**
```
Key: patient_id     | Value: 1                    | Type: Text
Key: file_type      | Value: Lab Report           | Type: Text
Key: title          | Value: CBC Blood Test        | Type: Text
Key: notes          | Value: Post fever test       | Type: Text
Key: file           | Value: [select file]         | Type: File
```
Valid file_type values: `Prescription`, `Lab Report`, `X-Ray`, `MRI`, `CT Scan`, `Invoice`, `Certificate`, `Insurance Document`, `Consent Form`, `General Medical Record`

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Record created",
    "data": {
        "id": 1,
        "file_url": "/uploads/1716206253-339733008.pdf"
    }
}
```

**Frontend action:**
- file_type → show as dropdown (not free text input)
- After upload → show toast → refresh records list
- Use `file_url` to display/download the file: `${BASE_URL}${file_url}`

---

### 36. GET /api/records/:id
**Why:** Get single record detail with file URL.
**Where:** Tap on a record card → detail/preview.
**Who:** Staff, Doctor, Admin.

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Record fetched",
    "data": {
        "id": 1,
        "file_url": "/uploads/1716206253-339733008.pdf",
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

**Frontend action:** Show file preview (PDF viewer or image). Show download button. `file_size` is in KB.

---

### 37. DELETE /api/records/:id
**Why:** Soft delete a record.
**Who:** Staff, Admin only.

---

### 38. POST /api/records/upload/single
**Why:** Upload a single file without attaching to a patient record.
**Where:** Used internally or for temporary uploads.
**Who:** Staff, Doctor, Admin.

**Request (form-data):**
```
Key: file | Value: [select file] | Type: File
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "File uploaded",
    "data": {
        "file_url": "/uploads/1716206253-339733008.png",
        "file_name": "xray_image.png",
        "file_size": 1024
    }
}
```

---

### 39. POST /api/records/upload/multiple
**Why:** Upload multiple files at once.
**Where:** Bulk upload screen.
**Who:** Staff, Doctor, Admin.

**Request (form-data):**
```
Key: files | Value: [select multiple files] | Type: File
```

**Success — 200:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Files uploaded",
    "data": [
        { "file_url": "/uploads/file1.pdf", "file_name": "report1.pdf", "file_size": 512 },
        { "file_url": "/uploads/file2.png", "file_name": "xray.png", "file_size": 1024 }
    ]
}
```

---

## REMINDER ENDPOINTS

---

### 40. POST /api/reminders
**Why:** Staff creates a follow-up reminder for a patient.
**Where:** Reminders screen → "+" button → form (patient, title, description, date/time) → save.
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
{
    "status": true,
    "status_code": 201,
    "message": "Reminder created",
    "data": { "id": 1 }
}
```

---

### 41. GET /api/reminders
**Why:** Get all reminders sorted by due date.
**Where:** Reminders screen → loads on open.
**Who:** Staff, Admin only.

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

**Frontend action:** Show reminders list. Pending reminders first. Show checkbox to mark done. Overdue reminders (remind_at < now && !is_done) → highlight in red.

---

### 42. PUT /api/reminders/:id
**Why:** Update reminder or mark as done.
**Where:** Reminder card → edit or "Mark Done" checkbox.
**Who:** Staff, Admin only.

**Request (mark as done):**
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

### 43. DELETE /api/reminders/:id
**Why:** Soft delete a reminder.
**Who:** Staff, Admin only.

---

## INVOICE ENDPOINTS

---

### 44. POST /api/invoices
**Why:** Staff creates a bill for a patient's visit.
**Where:** Patient profile → "Create Invoice" button → form (amount, description, notes) → save.
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
{
    "status": true,
    "status_code": 201,
    "message": "Invoice created",
    "data": { "id": 1 }
}
```

**Frontend action:** Show toast → navigate to invoice detail → show "Download PDF" button (Phase 2).

---

### 45. GET /api/invoices
**Why:** Get all invoices.
**Where:** Invoices screen → loads on open.
**Who:** Staff, Admin only.

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

**Frontend action:** Show invoice cards. Status badge colors:
- Unpaid → red
- Paid → green
- Cancelled → gray

---

### 46. GET /api/invoices/:id
**Why:** Get single invoice detail.
**Where:** Tap invoice card → detail screen.
**Who:** Staff, Admin.

---

### 47. PATCH /api/invoices/:id/status
**Why:** Update payment status only.
**Where:** Invoice detail → "Mark as Paid" button or status dropdown.
**Who:** Staff, Admin.

**Request:**
```json
{
    "status": "Paid"
}
```
Valid values: `Unpaid`, `Paid`, `Cancelled`

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Invoice status updated" }
```

---

## CERTIFICATE ENDPOINTS

---

### 48. POST /api/certificates
**Why:** Doctor creates a medical certificate for a patient.
**Where:** Patient profile → "New Certificate" → form (title, content, valid_until) → save.
**Who:** Doctor, Admin only. Staff blocked from creating.

**Request:**
```json
{
    "patient_id": 1,
    "title": "Sick Leave Certificate",
    "content": "This is to certify that Rajesh Verma was examined on 20th May 2026 and is advised rest for 5 days due to viral fever.",
    "valid_until": "2026-05-25"
}
```

**Success — 201:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Certificate created",
    "data": { "id": 1 }
}
```

**Frontend action:** Show toast → show certificate preview → "Download PDF" button (Phase 2).

---

### 49. GET /api/certificates
**Why:** Get all certificates.
**Where:** Certificates screen → loads on open.
**Who:** Doctor (own only), Staff (read all), Admin (read all).

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

**Frontend action:** Show certificate cards. Staff sees all. Doctor sees only where `doctor_id === loggedInUser.id`. Only doctor sees edit/delete buttons on own certificates.

---

### 50. GET /api/certificates/:id
**Why:** Get single certificate full content.
**Who:** Doctor (own only), Staff (read), Admin.

---

### 51. PUT /api/certificates/:id
**Why:** Update own certificate.
**Who:** Doctor (own only), Admin. Ownership checked.

---

### 52. DELETE /api/certificates/:id
**Why:** Soft delete own certificate.
**Who:** Doctor (own only), Admin. Ownership checked.

---

## NOTIFICATION ENDPOINTS

---

### 53. GET /api/notifications
**Why:** Get all notifications for the logged-in user + unread count.
**Where:** Bell icon tap → notification panel/screen.
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
            },
            {
                "id": 2,
                "title": "Reminder Due",
                "message": "Follow up with PT0005 - Rajesh Verma",
                "type": "Reminder",
                "is_read": false,
                "created_at": "2026-05-25T10:00:00.000Z"
            }
        ]
    }
}
```

**Frontend action:**
- `unread_count` → show as red badge on bell icon
- Unread notifications → bold/highlighted
- Read notifications → normal style
- Tap notification → mark as read + navigate to relevant screen based on `type`

---

### 54. PATCH /api/notifications/:id/read
**Why:** Mark a notification as read.
**Where:** Tap on notification → auto-call this. Or "Mark all as read" button.
**Who:** Any logged-in user (own notifications only).

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Notification marked as read" }
```

---

### 55. DELETE /api/notifications/:id
**Why:** Delete a notification.
**Where:** Swipe left on notification → delete. Or "..." menu → delete.
**Who:** Any logged-in user (own only).

**Success — 200:**
```json
{ "status": true, "status_code": 200, "message": "Notification deleted" }
```

---

## SEARCH ENDPOINTS

---

### 56. GET /api/search/global?q=
**Why:** Search across everything — patients, prescriptions, invoices, records.
**Where:** Top-level search bar in app header.
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
        { "category": "prescription", "id": 1, "label": "Viral fever", "detail": "Rest 5 days" },
        { "category": "invoice", "id": 1, "label": "1500.00", "detail": "Paid" }
    ]
}
```

**Frontend action:** Group results by `category`. Show section headers (Patients, Prescriptions, Invoices, Records). Tap any result → navigate to that item's detail screen.

---

### 57. GET /api/search/patients?q=
**Where:** Patient list screen search bar.

### 58. GET /api/search/prescriptions?q=
**Where:** Prescriptions screen search bar. Staff blocked.

### 59. GET /api/search/invoices?q=
**Where:** Invoices screen search bar. Doctor blocked.

### 60. GET /api/search/records?q=
**Where:** Records screen search bar.

---

## DASHBOARD ENDPOINT

---

### 61. GET /api/dashboard
**Why:** Get summary stats and today's appointments.
**Where:** Home/Dashboard screen → loads on app open.
**Who:** Admin sees all. Doctor sees own appointments only. Staff sees all.

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

**Frontend action:**
- `stats` → render 4 metric cards (patients, today's appointments, pending, revenue)
- `today_appointments` → render appointment cards below stats
- Tap appointment → navigate to appointment detail
- `total_revenue` → format as ₹45,000 (use Intl.NumberFormat)

---

## ROLE-BASED UI RENDERING

Use `user.role` from login response to show/hide menu items and buttons:

```
DOCTOR sees:
- Dashboard (own data)
- Patients (create + read)
- Appointments (own only)
- Prescriptions (own CRUD)
- Certificates (own CRUD)
- Templates (read all, CRUD own)
- Records (read only)
- Notifications
- Profile Settings

STAFF sees:
- Dashboard (all data)
- Patients (full CRUD)
- Appointments (full CRUD)
- Prescriptions (read only)
- Certificates (read only)
- Records (upload + read + delete)
- Invoices (full CRUD)
- Reminders (full CRUD)
- Notifications
- Profile Settings

ADMIN sees:
- Everything
- User management (approve/reject)
```

---

## COMMON ERROR CODES REFERENCE

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

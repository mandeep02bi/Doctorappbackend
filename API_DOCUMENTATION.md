# Medical App — API Documentation v2

**Base URL:** `https://adixonclinicos.info/api`
**Total Endpoints:** 59 | **Total Tables:** 11

**ALL references use codes: PT0001, DR0001, ST0001 — never internal IDs.**

## Auth Header (required on all except #1-#5)
```
Authorization: Bearer <accessToken>
```

---

# AUTH (10 endpoints)

---

### #1 POST /api/auth/register
**Who:** Anyone. **Where:** Register screen.
User gets isVerified=false. Cannot login until Admin approves.

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

**Success:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Registration successful. Please contact admin for account verification.",
    "data": {
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

**Frontend:** Green toast → redirect to login.

---

### #2 POST /api/auth/login
**Who:** Anyone. **Where:** Login screen.
Admin bypasses isVerified. Doctor/Staff must be approved first.

**Request:**
```json
{
    "email": "amit@doctor.com",
    "password": "Doctor@123",
    "platform": "android",
    "device_type": "mobile"
}
```

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Login successful",
    "data": {
        "user": {
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
{ "status": false, "status_code": 403, "message": "Your account is not verified yet. Please contact your admin.", "data": null }
```

**Frontend:** Save accessToken + user in AsyncStorage → Dashboard. Use `user.role` for all UI.

---

### #3 POST /api/auth/forgot-password
**Who:** Anyone. **Where:** Forgot password screen.

**Request:**
```json
{ "email": "amit@doctor.com" }
```

**Success:**
```json
{ "status": true, "status_code": 200, "message": "OTP sent to your email", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "No account found with this email", "data": null }
```

**Frontend:** Navigate to OTP screen.

---

### #4 POST /api/auth/verify-otp
**Who:** Anyone. **Where:** OTP screen.
OTP gets cleared after verification — cannot reuse.

**Request:**
```json
{ "email": "amit@doctor.com", "otp": "482917" }
```

**Success:**
```json
{ "status": true, "status_code": 200, "message": "OTP verified successfully", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 400, "message": "Invalid or expired OTP", "data": null }
```

**Frontend:** Navigate to reset password screen.

---

### #5 POST /api/auth/reset-password
**Who:** Anyone. **Where:** Reset password screen.
No OTP needed here — already verified and cleared in #4.

**Request:**
```json
{ "email": "amit@doctor.com", "new_password": "NewPass@123" }
```

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Password reset successful", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "User not found", "data": null }
```

**Frontend:** Navigate to login.

---

### #6 GET /api/auth/me
**Who:** Any logged-in user. **Where:** Profile screen, app launch.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Profile fetched",
    "data": {
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

**Errors:**
```json
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
```

**Frontend:** If 401 → clear storage → login screen.

---

### #7 POST /api/auth/logout
**Who:** Any logged-in user. **Where:** Logout button.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Logged out successfully", "data": null }
```

**Frontend:** Clear AsyncStorage → login screen.

---

### #8 GET /api/auth/pending
**Who:** Admin only. **Where:** Admin dashboard → pending approvals.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Pending users fetched",
    "data": [
        {
            "user_code": "DR0001",
            "first_name": "Amit",
            "last_name": "Sharma",
            "email": "amit@doctor.com",
            "phone": "9876543210",
            "role": "Doctor",
            "created_at": "2026-05-19T10:00:00.000Z"
        }
    ]
}
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

---

### #9 PATCH /api/auth/approve/:user_code
**Who:** Admin only. **Example:** `PATCH /api/auth/approve/DR0001`

**Success:**
```json
{ "status": true, "status_code": 200, "message": "User approved successfully", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "User not found", "data": null }
{ "status": false, "status_code": 400, "message": "User is already verified", "data": null }
{ "status": false, "status_code": 400, "message": "Cannot approve admin", "data": null }
```

---

### #10 PATCH /api/auth/reject/:user_code
**Who:** Admin only. **Example:** `PATCH /api/auth/reject/ST0001`

**Success:**
```json
{ "status": true, "status_code": 200, "message": "User rejected and removed", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "User not found", "data": null }
{ "status": false, "status_code": 400, "message": "Cannot reject admin", "data": null }
```

---

# PATIENT (6 endpoints)

---

### #11 POST /api/patients
**Who:** Staff, Doctor, Admin. **Where:** Patient list → "Add Patient".
email, middle_name, date_of_birth, age are all optional.

**Request:**
```json
{
    "first_name": "Rajesh",
    "middle_name": "Kumar",
    "last_name": "Verma",
    "phone": "9988776655",
    "email": "rajesh@patient.com",
    "date_of_birth": "1990-05-15",
    "age": 35,
    "gender": "Male",
    "blood_group": "B+",
    "street_address": "42 MG Road",
    "city": "Patna",
    "state": "Bihar",
    "zip_code": "800001"
}
```

**Success:**
```json
{
    "status": true,
    "status_code": 201,
    "message": "Patient created",
    "data": {
        "patient_code": "PT0001",
        "first_name": "Rajesh",
        "middle_name": "Kumar",
        "last_name": "Verma",
        "phone": "9988776655"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 400, "message": "First name and last name are required", "data": null }
```

**Frontend:** Green toast "Patient created — PT0001" → patient profile.

---

### #12 GET /api/patients
**Who:** Staff, Doctor, Admin. **Where:** Patient list screen.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Patients fetched",
    "data": [
        {
            "patient_code": "PT0001",
            "first_name": "Rajesh",
            "middle_name": "Kumar",
            "last_name": "Verma",
            "phone": "9988776655",
            "gender": "Male",
            "age": 35,
            "blood_group": "B+",
            "city": "Patna",
            "created_at": "2026-05-20T08:00:00.000Z"
        }
    ]
}
```

---

### #13 GET /api/patients/:patient_code
**Who:** Staff, Doctor, Admin. **Where:** Patient profile.
**Example:** `GET /api/patients/PT0001`

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Patient fetched",
    "data": {
        "patient_code": "PT0001",
        "first_name": "Rajesh",
        "middle_name": "Kumar",
        "last_name": "Verma",
        "email": "rajesh@patient.com",
        "phone": "9988776655",
        "date_of_birth": "1990-05-15",
        "age": 35,
        "gender": "Male",
        "blood_group": "B+",
        "street_address": "42 MG Road",
        "city": "Patna",
        "state": "Bihar",
        "zip_code": "800001",
        "created_at": "2026-05-20T08:00:00.000Z",
        "created_by_name": "Rahul Kumar"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**Frontend:** On opening profile, load all tabs using patient_code — see "PATIENT PROFILE LOADING" section at bottom.

---

### #14 PUT /api/patients/:patient_code
**Who:** Staff, Admin. **Example:** `PUT /api/patients/PT0001`

**Request:** Same fields as #11.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Patient updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

---

### #15 DELETE /api/patients/:patient_code
**Who:** Staff, Admin. **Example:** `DELETE /api/patients/PT0001`

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Patient deleted", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

---

### #16 GET /api/patients/search?q=
**Who:** Staff, Doctor, Admin. **Where:** Patient search bar.
**Examples:** `?q=rajesh` or `?q=9988776655` or `?q=PT0001`

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Search results",
    "data": [
        {
            "patient_code": "PT0001",
            "first_name": "Rajesh",
            "middle_name": "Kumar",
            "last_name": "Verma",
            "phone": "9988776655",
            "gender": "Male",
            "age": 35,
            "city": "Patna"
        }
    ]
}
```

**Frontend:** Debounce 300ms → call on each keystroke.

---

# APPOINTMENT (6 endpoints)

---

### #17 POST /api/appointments
**Who:** Staff, Admin. **Where:** Patient card → Appointment.

**Request:**
```json
{
    "patient_code": "PT0001",
    "doctor_code": "DR0001",
    "appointment_date": "2026-05-20 10:00:00",
    "reason": "Fever and headache",
    "notes": "Patient complaining since 3 days"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Appointment created", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
{ "status": false, "status_code": 404, "message": "Doctor not found", "data": null }
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

---

### #18 GET /api/appointments
**Who:** Staff (all), Doctor (own only), Admin (all).

**Variants:**
```
GET /api/appointments
GET /api/appointments?patient_code=PT0001
GET /api/appointments?doctor_code=DR0001
```

**Success:**
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
            "patient_name": "Rajesh Kumar Verma",
            "patient_code": "PT0001",
            "doctor_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "created_at": "2026-05-19T08:00:00.000Z"
        }
    ]
}
```

**Frontend:** Status colors: Pending=amber, Confirmed=blue, Completed=green, Cancelled=red.

---

### #19 GET /api/appointments/:id
**Who:** Staff, Doctor (own), Admin.

**Success:**
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
        "patient_name": "Rajesh Kumar Verma",
        "patient_code": "PT0001",
        "doctor_name": "Amit Sharma",
        "doctor_code": "DR0001",
        "booked_by_name": "Rahul Kumar",
        "created_at": "2026-05-19T08:00:00.000Z"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }
```

---

### #20 PUT /api/appointments/:id
**Who:** Staff, Admin.

**Request:**
```json
{ "appointment_date": "2026-05-21 11:00:00", "reason": "Updated reason", "notes": "Updated notes" }
```

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Appointment updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }
```

---

### #21 PATCH /api/appointments/:id/status
**Who:** Staff, Admin.

**Request:**
```json
{ "status": "Confirmed" }
```
Valid: `Pending`, `Confirmed`, `Completed`, `Cancelled`

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Status updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }
```

---

### #22 DELETE /api/appointments/:id
**Who:** Staff, Admin.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Appointment deleted", "data": null }
```

---

# PRESCRIPTION (11 endpoints)

---

### #23 POST /api/prescriptions
**Who:** Doctor, Admin. **Where:** Patient card → Prescribe → 3-tab form → Prescribe button.

**Request:**
```json
{
    "patient_code": "PT0001",
    "temperature": "98.6",
    "height": "175",
    "weight": "72",
    "pulse": "78",
    "blood_pressure": "120/80",
    "blood_sugar": "110",
    "hemoglobin": "13.5",
    "spo2": "98",
    "respiration_rate": "18",
    "allergy": "Penicillin",
    "chief_complaint": "Skin patches on face",
    "history": "Started 3 months ago",
    "findings": "White patches on cheeks",
    "diagnosis": "Vitiligo",
    "treatment_advice": "Apply cream morning and night",
    "end_note": "Review after 30 days",
    "follow_up_date": "2026-06-19",
    "prescription_date": "2026-05-19"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Prescription created", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

**Frontend:** After create → get id → POST medicines one by one → POST lab tests → show preview.

---

### #24 GET /api/prescriptions
**Who:** Doctor (own), Staff (all), Admin (all).

**Variants:**
```
GET /api/prescriptions
GET /api/prescriptions?patient_code=PT0001
GET /api/prescriptions?doctor_code=DR0001
```

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Prescriptions fetched",
    "data": [
        {
            "id": 1,
            "diagnosis": "Vitiligo",
            "chief_complaint": "Skin patches",
            "prescription_date": "2026-05-19",
            "follow_up_date": "2026-06-19",
            "doctor_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "patient_name": "Rajesh Kumar Verma",
            "patient_code": "PT0001",
            "created_at": "2026-05-19T10:30:00.000Z"
        }
    ]
}
```

---

### #25 GET /api/prescriptions/:id
**Who:** Doctor (own), Staff (read), Admin.
Returns EVERYTHING needed for PDF in one response.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Prescription fetched",
    "data": {
        "id": 1,
        "patient_name": "Rajesh Kumar Verma",
        "patient_code": "PT0001",
        "doctor_name": "Amit Sharma",
        "doctor_code": "DR0001",
        "gender": "Male",
        "date_of_birth": "1990-05-15",
        "age": 35,
        "patient_phone": "9988776655",
        "street_address": "42 MG Road",
        "city": "Patna",
        "temperature": "98.6",
        "height": "175",
        "weight": "72",
        "pulse": "78",
        "blood_pressure": "120/80",
        "blood_sugar": "110",
        "hemoglobin": "13.5",
        "spo2": "98",
        "respiration_rate": "18",
        "allergy": "Penicillin",
        "chief_complaint": "Skin patches on face",
        "history": "Started 3 months ago",
        "findings": "White patches on cheeks",
        "diagnosis": "Vitiligo",
        "treatment_advice": "Apply cream morning and night",
        "end_note": "Review after 30 days",
        "follow_up_date": "2026-06-19",
        "prescription_date": "2026-05-19",
        "medicines": [
            {
                "id": 1,
                "name": "Charak Pigmento Ointmento",
                "total_quantity": "1",
                "frequency": "Once a day",
                "route_form": "Topical",
                "no_of_days": "30",
                "instructions": "Apply in morning at affected area",
                "additional_comments": "Followed by 15 mins sun exposure between 7am to 9am"
            }
        ],
        "lab_tests": [
            {
                "id": 1,
                "test_name": "CBC",
                "additional_comments": "Check for infection"
            },
            {
                "id": 2,
                "test_name": "Blood Sugar (F/PP)",
                "additional_comments": null
            }
        ]
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Prescription not found", "data": null }
```

**Frontend:** Use this data + clinic profile + doctor profile to build PDF via Flutter `pdf` package.

---

### #26 PUT /api/prescriptions/:id
**Who:** Doctor (own), Admin.

**Request:** Same fields as #23 (send what changed).

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Prescription updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

---

### #27 DELETE /api/prescriptions/:id
**Who:** Doctor (own), Admin.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Prescription deleted", "data": null }
```

---

### #28 POST /api/prescriptions/:id/medicines
**Who:** Doctor (own), Admin. **Where:** Medicine/Product tab → "Save and Add next".

**Request:**
```json
{
    "name": "Charak Pigmento Ointmento",
    "total_quantity": "1",
    "frequency": "Once a day",
    "route_form": "Topical",
    "no_of_days": "30",
    "instructions": "Apply in morning at affected area",
    "additional_comments": "Followed by 15 mins sun exposure between 7am to 9am"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Medicine added", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

---

### #29 PUT /api/prescriptions/:id/medicines/:medicineId
**Who:** Doctor (own), Admin. **Where:** Medicine card → Edit.

**Request:** Same as #28.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Medicine updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }
```

---

### #30 DELETE /api/prescriptions/:id/medicines/:medicineId
**Who:** Doctor (own), Admin. **Where:** Medicine card → Delete.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Medicine deleted", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }
```

---

### #31 POST /api/prescriptions/:id/lab-tests
**Who:** Doctor (own), Admin. **Where:** Lab Test/Imaging tab → "Save and Add next".

**Request:**
```json
{
    "test_name": "CBC",
    "additional_comments": "Check for infection markers"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Lab test added", "data": { "id": 1 } }
```

---

### #32 PUT /api/prescriptions/:id/lab-tests/:labTestId
**Who:** Doctor (own), Admin. **Where:** Lab test card → Edit.

**Request:** Same as #31.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Lab test updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }
```

---

### #33 DELETE /api/prescriptions/:id/lab-tests/:labTestId
**Who:** Doctor (own), Admin. **Where:** Lab test card → Delete.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Lab test deleted", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }
```

---

# CERTIFICATE (5 endpoints)

---

### #34 POST /api/certificates
**Who:** Doctor, Admin. **Where:** Patient card → Certificate.

**Request:**
```json
{
    "patient_code": "PT0001",
    "title": "Medical Certificate",
    "description": "This is to certify that Rajesh Verma was examined on 19th May 2026...",
    "certificate_date": "2026-05-19"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Certificate created", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

**Frontend:** After create → PDF preview → Approve & Share.

---

### #35 GET /api/certificates
**Who:** Doctor (own), Staff (all), Admin (all).

**Variants:**
```
GET /api/certificates
GET /api/certificates?patient_code=PT0001
GET /api/certificates?doctor_code=DR0001
```

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Certificates fetched",
    "data": [
        {
            "id": 1,
            "title": "Medical Certificate",
            "description": "This is to certify...",
            "certificate_date": "2026-05-19",
            "patient_name": "Rajesh Kumar Verma",
            "patient_code": "PT0001",
            "doctor_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "created_at": "2026-05-19T10:45:00.000Z"
        }
    ]
}
```

---

### #36 GET /api/certificates/:id
**Who:** Doctor (own), Staff (read), Admin.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Certificate fetched",
    "data": {
        "id": 1,
        "title": "Medical Certificate",
        "description": "This is to certify that Rajesh Verma was examined...",
        "certificate_date": "2026-05-19",
        "patient_name": "Rajesh Kumar Verma",
        "patient_code": "PT0001",
        "gender": "Male",
        "age": 35,
        "blood_group": "B+",
        "doctor_name": "Amit Sharma",
        "doctor_code": "DR0001",
        "created_at": "2026-05-19T10:45:00.000Z"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Certificate not found", "data": null }
```

---

### #37 PUT /api/certificates/:id
**Who:** Doctor (own), Admin.

**Request:**
```json
{ "title": "Updated title", "description": "Updated description", "certificate_date": "2026-05-20" }
```

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Certificate updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

---

### #38 DELETE /api/certificates/:id
**Who:** Doctor (own), Admin.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Certificate deleted", "data": null }
```

---

# INSTRUCTION (5 endpoints)

---

### #39 POST /api/instructions
**Who:** Doctor, Admin. **Where:** Patient card → Instructions.

**Request:**
```json
{
    "patient_code": "PT0001",
    "title": "Posterior Canal BPPV के लिए – Epley Maneuver",
    "description": "घर पर करने की विधि (Posterior Canal BPPV के लिए – Epley Maneuver) करने की सरल विधि:...",
    "instruction_date": "2026-05-19"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Instruction created", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

**Frontend:** After create → PDF preview → Approve & Share.

---

### #40 GET /api/instructions
**Who:** Doctor (own), Staff (all), Admin (all).

**Variants:**
```
GET /api/instructions
GET /api/instructions?patient_code=PT0001
```

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Instructions fetched",
    "data": [
        {
            "id": 1,
            "title": "Posterior Canal BPPV – Epley Maneuver",
            "description": "घर पर करने की विधि...",
            "instruction_date": "2026-05-19",
            "patient_name": "Rajesh Kumar Verma",
            "patient_code": "PT0001",
            "doctor_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "created_at": "2026-05-19T11:00:00.000Z"
        }
    ]
}
```

---

### #41 GET /api/instructions/:id
**Who:** Doctor (own), Staff (read), Admin.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Instruction fetched",
    "data": {
        "id": 1,
        "title": "Posterior Canal BPPV – Epley Maneuver",
        "description": "घर पर करने की विधि...",
        "instruction_date": "2026-05-19",
        "patient_name": "Rajesh Kumar Verma",
        "patient_code": "PT0001",
        "gender": "Male",
        "age": 35,
        "doctor_name": "Amit Sharma",
        "doctor_code": "DR0001",
        "created_at": "2026-05-19T11:00:00.000Z"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Instruction not found", "data": null }
```

---

### #42 PUT /api/instructions/:id
**Who:** Doctor (own), Admin.

**Request:**
```json
{ "title": "Updated title", "description": "Updated text", "instruction_date": "2026-05-20" }
```

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Instruction updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

---

### #43 DELETE /api/instructions/:id
**Who:** Doctor (own), Admin.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Instruction deleted", "data": null }
```

---

# TEMPLATE (6 endpoints)

3 types: Medicine | Lab Test | Instruction. Each has own tab in "My Templates".

---

### #44 POST /api/templates
**Who:** Doctor, Admin. **Where:** My Templates → "Create A Template".

**Request (Medicine template):**
```json
{
    "type": "Medicine",
    "title": "Vitiligo in 3 years child",
    "content": "{\"medicines\":[{\"name\":\"Charak Pigmento\",\"total_quantity\":\"1\",\"frequency\":\"Once a day\",\"route_form\":\"Topical\",\"no_of_days\":\"30\",\"instructions\":\"Apply morning\"}]}"
}
```

**Request (Lab Test template):**
```json
{
    "type": "Lab Test",
    "title": "Female infertility",
    "content": "{\"tests\":[\"CBC\",\"Blood Sugar (F/PP)\",\"TSH\",\"Serum Prolactin, FSH, LH (Day 2-3)\"]}"
}
```

**Request (Instruction template):**
```json
{
    "type": "Instruction",
    "title": "Epley Maneuver",
    "content": "{\"description\":\"Full instruction text here...\"}"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Template created", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

---

### #45 GET /api/templates
**Who:** Doctor, Admin. **Where:** My Templates, "Choose from Template" button.

**Variants:**
```
GET /api/templates
GET /api/templates?type=Medicine
GET /api/templates?type=Lab Test
GET /api/templates?type=Instruction
```

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Templates fetched",
    "data": [
        {
            "id": 1,
            "type": "Medicine",
            "title": "Vitiligo in 3 years child",
            "content": "{...}",
            "created_by_name": "Amit Sharma",
            "doctor_code": "DR0001",
            "created_at": "2026-05-18T08:00:00.000Z"
        }
    ]
}
```

**Frontend:** "Choose from Template" on medicine tab → `GET /api/templates?type=Medicine` → tap "Add" → auto-fills form.

---

### #46 GET /api/templates/:id
**Who:** Doctor, Admin.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Template fetched",
    "data": {
        "id": 1,
        "type": "Medicine",
        "title": "Vitiligo in 3 years child",
        "content": "{\"medicines\":[{\"name\":\"Charak Pigmento\"...}]}",
        "created_by_name": "Amit Sharma",
        "doctor_code": "DR0001"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Template not found", "data": null }
```

---

### #47 GET /api/templates/search?type=Medicine&q=vitiligo
**Who:** Doctor, Admin. **Where:** Template search bar.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Search results",
    "data": [
        { "id": 1, "type": "Medicine", "title": "Vitiligo in 3 years child" }
    ]
}
```

---

### #48 PUT /api/templates/:id
**Who:** Doctor (own), Admin.

**Request:** Same as #44.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Template updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

---

### #49 DELETE /api/templates/:id
**Who:** Doctor (own), Admin.

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Template deleted", "data": null }
```

---

# REMINDER (4 endpoints)

Two types: Reminder | Payment Reminder (with payment link).

---

### #50 POST /api/reminders
**Who:** Doctor, Staff, Admin. **Where:** Patient card → Set Reminder, or inside prescription preview.

**Request (Reminder):**
```json
{
    "patient_code": "PT0001",
    "reminder_type": "Reminder",
    "title": "Dr. Ashish Kumar Singh has sent you a Reminder",
    "description": "Please take your prescribed medications on time\n\nRegards,\nDr. Ashish Kumar Singh\nVimPal Smart Clinic",
    "start_date": "2026-05-19",
    "end_date": "2026-05-26"
}
```

**Request (Payment Reminder):**
```json
{
    "patient_code": "PT0001",
    "reminder_type": "Payment Reminder",
    "title": "Payment Reminder",
    "description": "Your payment of ₹1500 is pending",
    "payment_link": "https://pay.example.com/inv123",
    "start_date": "2026-05-19",
    "end_date": "2026-05-24"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Reminder created", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**Frontend quick buttons** → calculate end_date from start_date: 1 Day | 5 Days | 7 Days | 15 Days | 1 Month

---

### #51 GET /api/reminders
**Who:** Doctor, Staff, Admin.

**Variants:**
```
GET /api/reminders
GET /api/reminders?patient_code=PT0001
GET /api/reminders?reminder_type=Payment Reminder
```

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Reminders fetched",
    "data": [
        {
            "id": 1,
            "reminder_type": "Reminder",
            "title": "Dr. Ashish Kumar Singh has sent you a Reminder",
            "description": "Please take your prescribed medications on time",
            "payment_link": null,
            "start_date": "2026-05-19",
            "end_date": "2026-05-26",
            "is_done": false,
            "patient_name": "Rajesh Kumar Verma",
            "patient_code": "PT0001",
            "created_by_name": "Amit Sharma",
            "created_at": "2026-05-19T11:00:00.000Z"
        }
    ]
}
```

---

### #52 PUT /api/reminders/:id
**Who:** Doctor, Staff, Admin.

**Request (mark done):**
```json
{ "is_done": true }
```

**Request (update):**
```json
{ "title": "Updated", "description": "Updated", "start_date": "2026-05-20", "end_date": "2026-05-27" }
```

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Reminder updated", "data": null }
```

---

### #53 DELETE /api/reminders/:id

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Reminder deleted", "data": null }
```

---

# INVOICE (4 endpoints)

---

### #54 POST /api/invoices
**Who:** Staff, Admin. **Where:** Patient card → Invoice.

**Request:**
```json
{
    "patient_code": "PT0001",
    "invoice_title": "Consultation Invoice",
    "bill_to_name": "Rajesh Verma",
    "currency": "INR",
    "total_amount": 1500.00,
    "description": "Consultation ₹500 + Lab Tests ₹1000",
    "notes": "Fever treatment - Dr. Amit"
}
```

**Success:**
```json
{ "status": true, "status_code": 201, "message": "Invoice created", "data": { "id": 1 } }
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

---

### #55 GET /api/invoices
**Who:** Staff, Admin.

**Variants:**
```
GET /api/invoices
GET /api/invoices?patient_code=PT0001
```

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Invoices fetched",
    "data": [
        {
            "id": 1,
            "invoice_title": "Consultation Invoice",
            "bill_to_name": "Rajesh Verma",
            "currency": "INR",
            "total_amount": "1500.00",
            "status": "Unpaid",
            "description": "Consultation + Lab Tests",
            "patient_name": "Rajesh Kumar Verma",
            "patient_code": "PT0001",
            "created_by_name": "Rahul Kumar",
            "created_at": "2026-05-19T12:00:00.000Z"
        }
    ]
}
```

**Frontend:** Status badges: Unpaid=red, Paid=green, Cancelled=gray.

---

### #56 GET /api/invoices/:id
**Who:** Staff, Admin.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Invoice fetched",
    "data": {
        "id": 1,
        "invoice_title": "Consultation Invoice",
        "bill_to_name": "Rajesh Verma",
        "currency": "INR",
        "total_amount": "1500.00",
        "status": "Unpaid",
        "description": "Consultation ₹500 + Lab Tests ₹1000",
        "notes": "Fever treatment - Dr. Amit",
        "patient_name": "Rajesh Kumar Verma",
        "patient_code": "PT0001",
        "created_by_name": "Rahul Kumar",
        "created_at": "2026-05-19T12:00:00.000Z"
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 404, "message": "Invoice not found", "data": null }
```

---

### #57 PATCH /api/invoices/:id/status
**Who:** Staff, Admin.

**Request:**
```json
{ "status": "Paid" }
```
Valid: `Unpaid`, `Paid`, `Cancelled`

**Success:**
```json
{ "status": true, "status_code": 200, "message": "Invoice status updated", "data": null }
```

**Errors:**
```json
{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }
```

---

# RECORDS — Combined View (1 endpoint)

This is NOT file upload. Just returns all patient data combined in one response.

---

### #58 GET /api/records?patient_code=PT0001
**Who:** Doctor, Staff, Admin. **Where:** Patient card → Records button.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Records fetched",
    "data": {
        "prescriptions": [
            {
                "id": 1,
                "diagnosis": "Vitiligo",
                "prescription_date": "2026-05-19",
                "doctor_name": "Amit Sharma",
                "doctor_code": "DR0001"
            }
        ],
        "certificates": [
            {
                "id": 1,
                "title": "Medical Certificate",
                "certificate_date": "2026-05-19",
                "doctor_name": "Amit Sharma"
            }
        ],
        "instructions": [
            {
                "id": 1,
                "title": "Epley Maneuver",
                "instruction_date": "2026-05-19",
                "doctor_name": "Amit Sharma"
            }
        ],
        "invoices": [
            {
                "id": 1,
                "invoice_title": "Consultation Invoice",
                "total_amount": "1500.00",
                "status": "Paid"
            }
        ],
        "appointments": [
            {
                "id": 1,
                "appointment_date": "2026-05-20T10:00:00.000Z",
                "reason": "Fever",
                "status": "Confirmed",
                "doctor_name": "Amit Sharma"
            }
        ],
        "reminders": [
            {
                "id": 1,
                "reminder_type": "Reminder",
                "title": "Follow-up reminder",
                "start_date": "2026-05-19",
                "end_date": "2026-05-26",
                "is_done": false
            }
        ]
    }
}
```

**Errors:**
```json
{ "status": false, "status_code": 400, "message": "patient_code is required", "data": null }
```

**Frontend:** Tap any item → navigate to its detail screen using the id.

---

# DASHBOARD (1 endpoint)

---

### #59 GET /api/dashboard
**Who:** Admin (all), Doctor (own), Staff (all). **Where:** Home screen.

**Success:**
```json
{
    "status": true,
    "status_code": 200,
    "message": "Dashboard data",
    "data": {
        "stats": {
            "total_patients": 247,
            "total_appointments": 12,
            "pending_appointments": 3,
            "unpaid_invoices": 5,
            "total_revenue": 45000
        },
        "today_appointments": [
            {
                "patient_name": "Rajesh Kumar Verma",
                "patient_code": "PT0001",
                "doctor_name": "Amit Sharma",
                "doctor_code": "DR0001",
                "reason": "Fever",
                "status": "Confirmed",
                "appointment_date": "2026-05-19T10:00:00.000Z"
            }
        ]
    }
}
```

**Frontend:** Stats → metric cards. Revenue → format ₹45,000.

---

# PATIENT PROFILE — FULL LOADING

When user taps patient card (PT0001), frontend loads all tabs:

```dart
final pc = "PT0001";

final patient       = await api.get("/patients/$pc");
final prescriptions = await api.get("/prescriptions?patient_code=$pc");
final certificates  = await api.get("/certificates?patient_code=$pc");
final instructions  = await api.get("/instructions?patient_code=$pc");
final invoices      = await api.get("/invoices?patient_code=$pc");
final reminders     = await api.get("/reminders?patient_code=$pc");
final appointments  = await api.get("/appointments?patient_code=$pc");
```

**Patient card action buttons:**
```
Prescribe    → POST /api/prescriptions    (Doctor only)
Certificate  → POST /api/certificates     (Doctor only)
Instructions → POST /api/instructions     (Doctor only)
Invoice      → POST /api/invoices         (Staff only)
Appointment  → POST /api/appointments     (Staff only)
Set Reminder → POST /api/reminders        (Doctor + Staff)
Records      → GET /api/records?patient_code=PT0001 (all roles)
Edit Patient → PUT /api/patients/PT0001   (Staff only)
Delete       → DELETE /api/patients/PT0001 (Staff only)
```

---

# ROLE-BASED UI

```dart
final r = user.role;

// Patient card buttons
bool canPrescribe     = r == 'Doctor' || r == 'Admin';
bool canCertificate   = r == 'Doctor' || r == 'Admin';
bool canInstruction   = r == 'Doctor' || r == 'Admin';
bool canInvoice       = r == 'Staff'  || r == 'Admin';
bool canBookAppt      = r == 'Staff'  || r == 'Admin';
bool canSetReminder   = true; // all roles
bool canEditPatient   = r == 'Staff'  || r == 'Admin';
bool canDeletePatient = r == 'Staff'  || r == 'Admin';

// Menu visibility
bool showInvoices  = r == 'Staff'  || r == 'Admin';
bool showTemplates = r == 'Doctor' || r == 'Admin';

// Ownership check
bool canEditRx   = r == 'Doctor' && rx.doctor_code == user.user_code;
bool canEditCert = r == 'Doctor' && cert.doctor_code == user.user_code;
bool canEditTmpl = tmpl.doctor_code == user.user_code;
```

---

# ERROR CODES

| Code | Meaning | Frontend Action |
|------|---------|----------------|
| 200 | Success | Green toast |
| 201 | Created | Green toast + redirect |
| 400 | Bad request | Show error message |
| 401 | Not authenticated | Clear token → login |
| 403 | Access denied / Not verified | Show error message |
| 404 | Not found | Show error message |
| 409 | Duplicate | Show error message |
| 500 | Server error | Show "Something went wrong" |

---

# ENDPOINT SUMMARY

| # | Module | Count | Numbers |
|---|--------|-------|---------|
| 1 | Auth | 10 | #1-#10 |
| 2 | Patient | 6 | #11-#16 |
| 3 | Appointment | 6 | #17-#22 |
| 4 | Prescription + Medicines + Lab Tests | 11 | #23-#33 |
| 5 | Certificate | 5 | #34-#38 |
| 6 | Instruction | 5 | #39-#43 |
| 7 | Template | 6 | #44-#49 |
| 8 | Reminder | 4 | #50-#53 |
| 9 | Invoice | 4 | #54-#57 |
| 10 | Records (combined view) | 1 | #58 |
| 11 | Dashboard | 1 | #59 |
| | **TOTAL** | **59** | |

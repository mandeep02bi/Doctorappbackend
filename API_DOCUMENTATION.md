# VimPal Smart Clinic — API Documentation (FINAL)

**Base URL:** `https://adixonclinicos.info/api`
**Total Endpoints:** 78 | **Tables:** 14 | **Roles:** Admin, Doctor, Staff

---

## Response Format (EVERY endpoint)
```json
{
  "status": true,
  "status_code": 200,
  "message": "Human readable message",
  "data": { }
}
```
- `status: true` = success, `status: false` = error
- `data` = null on errors, object/array on success
- Always show `message` in toast notification

## Auth Header (required on all except #1–#5)
```
Authorization: Bearer <accessToken>
```

## Token Expiry
- `accessToken` → 7 days
- `refreshToken` → 30 days
- On any 401 → clear tokens → navigate to Login

---

# 🔐 AUTH (8 Endpoints)

---

### #1 POST /api/auth/register
**Who:** Anyone (no token) | **Screen:** Register

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

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| first_name | string | ✅ | |
| last_name | string | ✅ | |
| email | string | ✅ | Unique |
| phone | string | ❌ | |
| password | string | ✅ | |
| role | string | ✅ | `"Doctor"` or `"Staff"` only |
| platform | string | ❌ | `"web"` / `"android"` / `"ios"` / `"unknown"` |
| device_type | string | ❌ | `"mobile"` / `"tablet"` / `"desktop"` / `"unknown"` |

**✅ 201:**
```json
{
  "status": true,
  "status_code": 201,
  "message": "Registration successful. Please contact admin for account verification.",
  "data": {
    "first_name": "Amit",
    "last_name": "Sharma",
    "email": "amit@doctor.com",
    "role": "Doctor"
  }
}
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "All fields are required", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Role must be Doctor or Staff", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Admin registration is not allowed", "data": null }`

**❌ 409:** `{ "status": false, "status_code": 409, "message": "Email already registered", "data": null }`

**Frontend:** Show success → "Waiting for approval" screen. Do NOT auto-login.

---

### #2 POST /api/auth/login
**Who:** Anyone (no token) | **Screen:** Login

**Request:**
```json
{
  "email": "amit@doctor.com",
  "password": "Doctor@123",
  "platform": "android",
  "device_type": "mobile"
}
```

**✅ 200:**
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

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Email and password are required", "data": null }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Invalid email or password", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Your account is not verified yet. Please contact your admin.", "data": null }`

**Frontend:** Store tokens + user. Route by role: Admin → Admin Panel, Doctor → Doctor Home, Staff → Staff Home. Admin always bypasses isVerified.

---

### #3 POST /api/auth/forgot-password
**Who:** Anyone | **Screen:** Login → "Forgot Password?"

**Request:** `{ "email": "amit@doctor.com" }`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "OTP sent to your email", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "No account found with this email", "data": null }`

**Frontend:** Navigate to OTP screen. OTP expires in 10 minutes.

---

### #4 POST /api/auth/verify-otp
**Who:** Anyone | **Screen:** OTP input

**Request:** `{ "email": "amit@doctor.com", "otp": "482917" }`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "OTP verified successfully", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Invalid or expired OTP", "data": null }`

**Frontend:** Navigate to New Password screen. Pass email forward.

---

### #5 POST /api/auth/reset-password
**Who:** Anyone | **Screen:** New Password (after OTP verified)

**Request:** `{ "email": "amit@doctor.com", "new_password": "NewPass@123" }`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Password reset successful", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Email and new password are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

**Frontend:** Navigate to Login.

---

### #6 GET /api/auth/me
**Who:** All logged in | **Screen:** App launch (validate token) + Profile

**✅ 200:**
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
    "last_login_at": "2026-05-19T10:30:00.000Z",
    "created_at": "2026-05-01T08:00:00.000Z"
  }
}
```

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Token expired or invalid", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

**Frontend:** On 401 → clear tokens → Login screen.

---

### #7 POST /api/auth/logout
**Who:** All logged in | **Screen:** Settings → "Logout"

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Logged out successfully", "data": null }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }`

**Frontend:** Clear all tokens + user data → Login screen.

---
### #7 POST /api/auth/refresh-token
{ "status": true, "status_code": 200, "message": "Token refreshed", "data": { "accessToken": "eyJhbGciOiJIUzI1NiIs..." } }
❌ 400:{ "status": false, "status_code": 400, "message": "Refresh token is required", "data": null }
❌ 401 Invalid token:{ "status": false, "status_code": 401, "message": "Invalid refresh token", "data": null }
❌ 401 Expired:{ "status": false, "status_code": 401, "message": "Refresh token expired. Please login again"}

### #8 GET /api/auth/doctors
**Who:** All logged in (Admin, Doctor, Staff all need this)
**When:** Appointment form → Doctor dropdown
**Why in auth not admin:** Staff and Doctor also need this for booking appointments.

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Doctors fetched",
  "data": [
    {
      "user_code": "DR0001",
      "first_name": "Amit",
      "last_name": "Sharma",
      "email": "amit@doctor.com",
      "phone": "9876543210"
    },
    {
      "user_code": "DR0002",
      "first_name": "Priya",
      "last_name": "Singh",
      "email": "priya@doctor.com",
      "phone": "9988776655"
    }
  ]
}
```

**✅ 200 Empty:** `{ "status": true, "status_code": 200, "message": "Doctors fetched", "data": [] }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }`

**Frontend — Doctor dropdown (used in appointment form):**
```dart
// User sees: "Dr. Amit Sharma"
// Flutter holds: "DR0001"
// API receives: doctor_code: "DR0001"
DropdownButton(
  value: selectedDoctorCode,
  items: doctors.map((d) => DropdownMenuItem(
    value: d['user_code'],
    child: Text("Dr. ${d['first_name']} ${d['last_name']}"),
  )).toList(),
  onChanged: (code) => selectedDoctorCode = code,
)
```

---

# 👤 PATIENT (6 Endpoints)

---

### #9 POST /api/patients
**Who:** All | **Screen:** Patient list → "+" → fill form → "Save"

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

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| first_name | string | ✅ | |
| middle_name | string | ❌ | |
| last_name | string | ✅ | |
| email | string | ❌ | |
| phone | string | ❌ | |
| date_of_birth | string | ❌ | `YYYY-MM-DD` |
| age | integer | ❌ | |
| gender | string | ❌ | `"Male"` / `"Female"` / `"Other"` |
| blood_group | string | ❌ | |
| street_address | string | ❌ | |
| city | string | ❌ | |
| state | string | ❌ | |
| zip_code | string | ❌ | |

**✅ 201:**
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

**❌ 400:** `{ "status": false, "status_code": 400, "message": "First name and last name are required", "data": null }`

---

### #10 GET /api/patients
**Who:** All | **Screen:** Patient list + Patient dropdown in forms

**✅ 200:**
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
      "created_at": "2026-05-19T08:00:00.000Z"
    }
  ]
}
```

**✅ 200 Empty:** `{ "status": true, "status_code": 200, "message": "Patients fetched", "data": [] }`

**Frontend — Patient dropdown (for appointments, prescriptions, etc.):**
```dart
SearchableDropdown(
  items: patients.map((p) => DropdownMenuItem(
    value: p['patient_code'],
    child: Text("${p['first_name']} ${p['last_name']} - ${p['phone'] ?? ''}"),
  )).toList(),
  onChanged: (code) => selectedPatientCode = code,
)
```

---

### #11 GET /api/patients/:patient_code
**Who:** All | **URL:** `GET /api/patients/PT0001`

**✅ 200:**
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
    "created_at": "2026-05-19T08:00:00.000Z",
    "created_by_name": "Rahul Kumar"
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #12 PUT /api/patients/:patient_code
**Who:** Admin, Staff (NOT Doctor) | **URL:** `PUT /api/patients/PT0001`

**Request:** Same fields as #9.

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Patient updated", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

**Frontend:** Hide edit button if `user.role == 'Doctor'`.

---

### #13 DELETE /api/patients/:patient_code
**Who:** Admin, Staff (NOT Doctor)

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Patient deleted", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

---

### #14 GET /api/patients/search?q=rajesh
**Who:** All | **Screen:** Patient search bar → type → live results

**✅ 200:**
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

**✅ 200 Empty:** `{ "status": true, "status_code": 200, "message": "Search results", "data": [] }`

**Frontend:** Debounce 300ms. Searches first_name, middle_name, last_name, phone, patient_code. Max 20 results.

---

# 📅 APPOINTMENT (8 Endpoints)

---

### #15 POST /api/appointments
**Who:** All | **Screen:** Appointment → "+" → select doctor dropdown → select patient dropdown OR walk-in → "Save"

**Way 1 — Existing Patient + Doctor dropdown:**
```json
{
  "patient_code": "PT0001",
  "doctor_code": "DR0001",
  "appointment_date": "2026-05-20",
  "appointment_time": "10:00",
  "purpose": "Fever",
  "notes": "Patient called in advance"
}
```

**Way 2 — Walk-in + Doctor dropdown:**
```json
{
  "doctor_code": "DR0001",
  "patient_name": "Rajesh Verma",
  "patient_gender": "Male",
  "patient_age": 35,
  "patient_age_unit": "Year",
  "patient_dob": "1990-05-15",
  "patient_whatsapp": "9988776655",
  "patient_email": "rajesh@email.com",
  "appointment_date": "2026-05-20",
  "appointment_time": "10:00",
  "purpose": "Fever"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| doctor_code | string | ❌ | From doctor dropdown (#8). Auto-self if Doctor. Required if Staff/Admin. |
| patient_code | string | ❌ | From patient dropdown (#10). If missing = walk-in |
| patient_name | string | ❌ | Required for walk-in only |
| patient_gender | string | ❌ | `"Male"` / `"Female"` / `"Other"` |
| patient_age | integer | ❌ | |
| patient_age_unit | string | ❌ | `"Year"` / `"Month"` (default: Year) |
| patient_dob | string | ❌ | `YYYY-MM-DD` |
| patient_whatsapp | string | ❌ | |
| patient_email | string | ❌ | |
| appointment_date | string | ✅ | `YYYY-MM-DD` |
| appointment_time | string | ✅ | `HH:MM` (24hr) |
| purpose | string | ❌ | |
| notes | string | ❌ | |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Appointment created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Appointment date and time are required", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient name is required for walk-in", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Doctor is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Doctor not found", "data": null }`

**Frontend — Appointment form has 2 dropdowns:**
```dart
// Load on form open:
final doctors  = await api.get("/auth/doctors");   // #8
final patients = await api.get("/patients");        // #10

// Doctor dropdown → shows "Dr. Amit Sharma" → holds "DR0001"
// Patient dropdown → shows "Rajesh Verma - 9988776655" → holds "PT0001"
// Toggle [Existing Patient] ←→ [Walk-in] to switch modes
// If logged-in user is Doctor → auto-select self, hide doctor dropdown
```

---

### #16 GET /api/appointments
**Who:** All | **Screen:** Appointment list
**Query:** `?patient_code=PT0001` | `?filter=today` | `?filter=history` | `?filter=upcoming` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Appointments fetched",
  "data": [
    {
      "id": 1,
      "patient_name": "Rajesh Kumar Verma",
      "patient_code": "PT0001",
      "patient_gender": "Male",
      "patient_age": 35,
      "patient_age_unit": "Year",
      "patient_whatsapp": "9988776655",
      "appointment_date": "2026-05-20",
      "appointment_time": "10:00:00",
      "purpose": "Fever",
      "status": "Pending",
      "doctor_name": "Amit Sharma",
      "doctor_code": "DR0001",
      "is_walkin": 0,
      "created_at": "2026-05-19T08:00:00.000Z"
    }
  ]
}
```

**✅ 200 Empty:** `{ "status": true, "status_code": 200, "message": "Appointments fetched", "data": [] }`

**Frontend:** `is_walkin: 1` → show "Walk-in" badge. `patient_code: null` → no patient profile link. Doctor sees only own appointments.

---

### #17 GET /api/appointments/today
**Who:** All | **Screen:** Dashboard → Today's Appointments

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Today's appointments fetched",
  "data": [
    {
      "id": 1,
      "patient_name": "Rajesh Verma",
      "patient_code": "PT0001",
      "appointment_time": "10:00:00",
      "purpose": "Fever",
      "status": "Pending",
      "is_walkin": 0
    }
  ]
}
```

**✅ 200 Empty:** `{ "status": true, "status_code": 200, "message": "Today's appointments fetched", "data": [] }`

---

### #18 GET /api/appointments/calendar?month=2026-05
**Who:** All | **Screen:** Calendar view → swipe months

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Calendar appointments fetched",
  "data": {
    "2026-05-19": [
      { "id": 1, "patient_name": "Rajesh Verma", "patient_code": "PT0001", "appointment_date": "2026-05-19", "appointment_time": "10:00:00", "status": "Confirmed" }
    ],
    "2026-05-20": [
      { "id": 2, "patient_name": "Walk-in Patient", "patient_code": null, "appointment_date": "2026-05-20", "appointment_time": "14:00:00", "status": "Pending" }
    ]
  }
}
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Month parameter is required (YYYY-MM)", "data": null }`

**Frontend:** Grouped by date. Dates with no appointments don't appear. Show dot indicators on calendar.

---

### #19 GET /api/appointments/:id
**Who:** All | **URL:** `GET /api/appointments/1`

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Appointment fetched",
  "data": {
    "id": 1,
    "patient_name": "Rajesh Kumar Verma",
    "patient_gender": "Male",
    "patient_age": 35,
    "patient_age_unit": "Year",
    "patient_dob": "1990-05-15",
    "patient_whatsapp": "9988776655",
    "patient_email": "rajesh@email.com",
    "appointment_date": "2026-05-20",
    "appointment_time": "10:00:00",
    "purpose": "Fever",
    "notes": "Called in advance",
    "status": "Pending",
    "patient_code": "PT0001",
    "doctor_name": "Amit Sharma",
    "doctor_code": "DR0001",
    "booked_by_name": "Rahul Kumar",
    "is_walkin": 0,
    "created_at": "2026-05-19T08:00:00.000Z",
    "updated_at": "2026-05-19T08:00:00.000Z"
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }`

---

### #20 PUT /api/appointments/:id
**Who:** All | **Request:** Same fields as #15.

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Appointment updated", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }`

---

### #21 PATCH /api/appointments/:id/status
**Who:** All

**Request:** `{ "status": "Confirmed" }` → Valid: `"Pending"` | `"Confirmed"` | `"Completed"` | `"Cancelled"`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Status updated", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }`

---

### #22 DELETE /api/appointments/:id
**Who:** All

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Appointment deleted", "data": null }`

---

# 💊 PRESCRIPTION (11 Endpoints) — PDF Limit on Create

---

### #23 POST /api/prescriptions
**Who:** Doctor, Admin | **PDF Limit:** 300 total across prescriptions + certificates + instructions

**Request:**
```json
{
  "patient_code": "PT0001",
  "appointment_id": 1,
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
  "chief_complaint": "Skin patches on arms",
  "history": "Started 3 months ago",
  "findings": "White patches on both arms",
  "diagnosis": "Vitiligo",
  "treatment_advice": "Apply cream daily",
  "end_note": "Review after 30 days",
  "follow_up_date": "2026-06-19",
  "notes": "Internal note",
  "prescription_date": "2026-05-19"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| patient_code | string | ✅ | From patient dropdown |
| appointment_id | integer | ❌ | Link to appointment |
| temperature | string | ❌ | 9 vitals — all optional |
| height | string | ❌ | |
| weight | string | ❌ | |
| pulse | string | ❌ | |
| blood_pressure | string | ❌ | |
| blood_sugar | string | ❌ | |
| hemoglobin | string | ❌ | |
| spo2 | string | ❌ | |
| respiration_rate | string | ❌ | |
| allergy | string | ❌ | 8 case history — all optional |
| chief_complaint | string | ❌ | |
| history | string | ❌ | |
| findings | string | ❌ | |
| diagnosis | string | ❌ | |
| treatment_advice | string | ❌ | |
| end_note | string | ❌ | |
| follow_up_date | string | ❌ | `YYYY-MM-DD` |
| notes | string | ❌ | Internal, not on PDF |
| prescription_date | string | ❌ | `YYYY-MM-DD` |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Prescription created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 429:** `{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

**Frontend Flow:** Fill form → add medicines/tests locally → preview PDF → "Approve & Share" → THEN API calls: POST prescription → POST medicines → POST lab-tests.

---

### #24 GET /api/prescriptions
**Who:** All | **Query:** `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Prescriptions fetched",
  "data": [
    { "id": 1, "diagnosis": "Vitiligo", "chief_complaint": "Skin patches", "prescription_date": "2026-05-19", "follow_up_date": "2026-06-19", "created_at": "...", "doctor_name": "Amit Sharma", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001" }
  ]
}
```

---

### #25 GET /api/prescriptions/:id
**Who:** All | Returns full data + medicines[] + lab_tests[] for PDF.

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Prescription fetched",
  "data": {
    "id": 1,
    "temperature": "98.6", "height": "175", "weight": "72", "pulse": "78",
    "blood_pressure": "120/80", "blood_sugar": "110", "hemoglobin": "13.5",
    "spo2": "98", "respiration_rate": "18",
    "allergy": "Penicillin", "chief_complaint": "Skin patches", "history": "3 months",
    "findings": "White patches", "diagnosis": "Vitiligo", "treatment_advice": "Apply cream",
    "end_note": "Review after 30 days", "follow_up_date": "2026-06-19",
    "prescription_date": "2026-05-19",
    "doctor_name": "Amit Sharma", "patient_name": "Rajesh Kumar Verma",
    "patient_code": "PT0001", "gender": "Male", "age": 35,
    "patient_phone": "9988776655", "street_address": "42 MG Road", "city": "Patna",
    "medicines": [
      { "id": 1, "name": "Charak Pigmento", "total_quantity": "1", "frequency": "Once a day", "route_form": "Topical", "no_of_days": "30", "instructions": "Apply morning", "additional_comments": "Sun exposure 15 mins" }
    ],
    "lab_tests": [
      { "id": 1, "test_name": "CBC", "additional_comments": "Check infection" }
    ]
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Prescription not found", "data": null }`

---

### #26 PUT /api/prescriptions/:id
**Who:** Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Prescription updated", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #27 DELETE /api/prescriptions/:id
**Who:** Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Prescription deleted", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #28 POST /api/prescriptions/:id/medicines
**Who:** Doctor (own), Admin | **URL:** `POST /api/prescriptions/1/medicines`

**Request:**
```json
{
  "name": "Charak Pigmento",
  "total_quantity": "1",
  "frequency": "Once a day",
  "route_form": "Topical",
  "no_of_days": "30",
  "instructions": "Apply morning",
  "additional_comments": "Sun exposure 15 mins"
}
```

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Medicine added", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Medicine name is required", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

---

### #29 PUT /api/prescriptions/:id/medicines/:medicineId

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Medicine updated", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }`

---

### #30 DELETE /api/prescriptions/:id/medicines/:medicineId

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Medicine deleted", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }`

---

### #31 POST /api/prescriptions/:id/lab-tests

**Request:** `{ "test_name": "CBC", "additional_comments": "Check infection" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Lab test added", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Test name is required", "data": null }`

---

### #32 PUT /api/prescriptions/:id/lab-tests/:labTestId

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Lab test updated", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }`

---

### #33 DELETE /api/prescriptions/:id/lab-tests/:labTestId

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Lab test deleted", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }`

---

# 📜 CERTIFICATE (5 Endpoints) — PDF Limit

---

### #34 POST /api/certificates
**Who:** Doctor, Admin

**Request:** `{ "patient_code": "PT0001", "title": "Medical Certificate", "description": "This is to certify...", "certificate_date": "2026-05-19" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Certificate created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 429:** `{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }`

---

### #35 GET /api/certificates
**Query:** `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Certificates fetched",
  "data": [{ "id": 1, "title": "Medical Certificate", "description": "This is to certify...", "certificate_date": "2026-05-19", "created_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "doctor_name": "Amit Sharma" }]
}
```

---

### #36 GET /api/certificates/:id

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Certificate fetched",
  "data": { "id": 1, "title": "Medical Certificate", "description": "This is to certify...", "certificate_date": "2026-05-19", "created_at": "...", "updated_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "gender": "Male", "age": 35, "blood_group": "B+", "doctor_name": "Amit Sharma" }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Certificate not found", "data": null }`

---

### #37 PUT /api/certificates/:id — Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Certificate updated", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #38 DELETE /api/certificates/:id — Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Certificate deleted", "data": null }`

**❌ 403 / 404:** Same as #37.

---

# 📋 INSTRUCTION (5 Endpoints) — PDF Limit

---

### #39 POST /api/instructions
**Who:** Doctor, Admin

**Request:** `{ "patient_code": "PT0001", "title": "Epley Maneuver", "description": "Step 1: Sit on bed...", "instruction_date": "2026-05-19" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Instruction created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 429:** `{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }`

---

### #40 GET /api/instructions — `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Instructions fetched",
  "data": [{ "id": 1, "title": "Epley Maneuver", "description": "Step 1...", "instruction_date": "2026-05-19", "created_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "doctor_name": "Amit Sharma" }]
}
```

---

### #41 GET /api/instructions/:id

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Instruction fetched",
  "data": { "id": 1, "title": "Epley Maneuver", "description": "Step 1...", "instruction_date": "2026-05-19", "created_at": "...", "updated_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "gender": "Male", "age": 35, "doctor_name": "Amit Sharma" }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Instruction not found", "data": null }`

---

### #42 PUT /api/instructions/:id — Doctor (own), Admin
### #43 DELETE /api/instructions/:id — Doctor (own), Admin

Same response patterns as certificates (#37, #38).

---

# ✍️ CONSENT (5 Endpoints) — No PDF Limit

---

### #44 POST /api/consents
**Who:** Doctor, Admin

**Request:** `{ "patient_code": "PT0001", "title": "Surgery Consent", "description": "I hereby consent...", "consent_date": "2026-05-19" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Consent created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #45 GET /api/consents — `?patient_code=PT0001` | `?sort=oldest`
### #46 GET /api/consents/:id
### #47 PUT /api/consents/:id — Doctor (own), Admin
### #48 DELETE /api/consents/:id — Doctor (own), Admin

Same response patterns as certificates.

---

# 📝 TEMPLATE (6 Endpoints)

---

### #49 POST /api/templates
**Who:** Doctor, Admin

**Request:** `{ "type": "Medicine", "title": "Vitiligo treatment", "content": "{\"medicines\":[...]}" }`

Types: `"Medicine"` | `"Lab Test"` | `"Instruction"`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Template created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Type, title and content are required", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Type must be Medicine, Lab Test or Instruction", "data": null }`

---

### #50 GET /api/templates — `?type=Medicine`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Templates fetched",
  "data": [{ "id": 1, "type": "Medicine", "title": "Vitiligo treatment", "content": "{\"medicines\":[...]}", "created_at": "...", "created_by_name": "Amit Sharma" }]
}
```

---

### #51 GET /api/templates/:id

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Template fetched",
  "data": { "id": 1, "type": "Medicine", "title": "Vitiligo treatment", "content": "{\"medicines\":[...]}", "created_at": "...", "updated_at": "...", "created_by_name": "Amit Sharma" }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Template not found", "data": null }`

---

### #52 GET /api/templates/search?type=Medicine&q=vitiligo

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Search results",
  "data": [{ "id": 1, "type": "Medicine", "title": "Vitiligo treatment" }]
}
```

---

### #53 PUT /api/templates/:id — Doctor (own), Admin
### #54 DELETE /api/templates/:id — Doctor (own), Admin

Same ownership patterns.

---

# 🔔 REMINDER (4 Endpoints)

---

### #55 POST /api/reminders
**Who:** All

**Request (Reminder):** `{ "patient_code": "PT0001", "reminder_type": "Reminder", "title": "Follow-up", "description": "Take meds", "start_date": "2026-05-19", "end_date": "2026-05-26" }`

**Request (Payment):** `{ "patient_code": "PT0001", "reminder_type": "Payment Reminder", "title": "Payment due", "description": "₹1500 pending", "payment_link": "https://pay.example.com/123", "start_date": "2026-05-19", "end_date": "2026-05-24" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Reminder created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code and title are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #56 GET /api/reminders — `?patient_code=PT0001` | `?reminder_type=Payment Reminder`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Reminders fetched",
  "data": [{ "id": 1, "reminder_type": "Reminder", "title": "Follow-up", "description": "Take meds", "payment_link": null, "start_date": "2026-05-19", "end_date": "2026-05-26", "is_done": 0, "created_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "created_by_name": "Amit Sharma" }]
}
```

**Frontend:** `is_done: 0` = pending, `is_done: 1` = completed. Show checkbox.

---

### #57 PUT /api/reminders/:id — mark done: `{ "is_done": true }` or full edit
### #58 DELETE /api/reminders/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Reminder updated/deleted", "data": null }`

---

# 🧾 INVOICE (8 Endpoints)

---

### #59 POST /api/invoices
**Who:** Staff, Admin (NOT Doctor)

**Request:**
```json
{
  "patient_code": "PT0001",
  "bill_to_name": "Rajesh Verma",
  "invoice_title": "Invoice",
  "currency": "INR",
  "discount_title": "Discount",
  "discount_value": 100,
  "discount_type": "Amount",
  "advance_title": "Amount Paid",
  "advance_amount": 500,
  "tax_title": "GST",
  "tax_value": 18,
  "tax_type": "Percentage",
  "remark": "Consultation",
  "invoice_date": "2026-05-19",
  "status": "To pay"
}
```

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Invoice created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

---

### #60 GET /api/invoices — `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Invoices fetched",
  "data": [{ "id": 1, "invoice_title": "Invoice", "bill_to_name": "Rajesh Verma", "currency": "INR", "total_amount": "1170.00", "status": "To pay", "invoice_date": "2026-05-19", "created_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "created_by_name": "Rahul Kumar" }]
}
```

---

### #61 GET /api/invoices/:id — returns invoice + items[]

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Invoice fetched",
  "data": {
    "id": 1, "bill_to_name": "Rajesh Verma", "invoice_title": "Invoice", "currency": "INR",
    "discount_title": "Discount", "discount_value": "100.00", "discount_type": "Amount",
    "advance_title": "Amount Paid", "advance_amount": "500.00",
    "tax_title": "GST", "tax_value": "18.00", "tax_type": "Percentage",
    "remark": "Consultation", "invoice_date": "2026-05-19",
    "total_amount": "1170.00", "status": "To pay",
    "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001",
    "created_by_name": "Rahul Kumar",
    "items": [
      { "id": 1, "description": "Consultation", "amount": "500.00" },
      { "id": 2, "description": "Lab Tests", "amount": "1000.00" }
    ]
  }
}
```

**Total formula:** `items_total + tax - discount - advance`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Invoice not found", "data": null }`

---

### #62 PUT /api/invoices/:id — auto-recalculates total

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Invoice updated", "data": null }`

---

### #63 PATCH /api/invoices/:id/status

**Request:** `{ "status": "Paid" }` → Valid: `"To pay"` | `"Paid"` | `"None"`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Invoice status updated", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }`

---

### #64 DELETE /api/invoices/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Invoice deleted", "data": null }`

---

### #65 POST /api/invoices/:id/items — auto-recalculates total

**Request:** `{ "description": "Consultation Fee", "amount": 500 }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Item added", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Description and amount are required", "data": null }`

---

### #66 DELETE /api/invoices/:id/items/:itemId — auto-recalculates total

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Item deleted", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Item not found", "data": null }`

---

# 🔍 RECORDS — Combined Patient View (1 Endpoint)

---

### #67 GET /api/records?patient_code=PT0001&search=fever
**Who:** All | **Screen:** Patient profile → "Records" tab

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| patient_code | string | ✅ | |
| search | string | ❌ | Searches across all modules |

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Records fetched",
  "data": {
    "prescriptions": [{ "id": 1, "diagnosis": "Vitiligo", "chief_complaint": "Skin patches", "prescription_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "certificates": [{ "id": 1, "title": "Medical Certificate", "certificate_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "instructions": [{ "id": 1, "title": "Epley Maneuver", "instruction_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "consents": [{ "id": 1, "title": "Surgery Consent", "consent_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "invoices": [{ "id": 1, "invoice_title": "Invoice", "total_amount": "1170.00", "status": "To pay" }],
    "appointments": [{ "id": 1, "appointment_date": "2026-05-20", "appointment_time": "10:00:00", "purpose": "Fever", "status": "Confirmed", "doctor_name": "Amit Sharma" }],
    "reminders": [{ "id": 1, "title": "Follow-up", "start_date": "2026-05-19", "is_done": 0 }]
  }
}
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "patient_code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**Frontend:** Show as tabs or sections. Each section shows count badge. Empty arrays = "No data" placeholder.

---

# 🛡️ ADMIN PANEL (11 Endpoints) — Admin Only

**All endpoints below return ❌ 403** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }` for non-admin users.

---

### #68 GET /api/admin/dashboard
**Screen:** Admin Panel → Dashboard

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Admin dashboard",
  "data": {
    "users": {
      "total_doctors": 3,
      "total_staff": 2,
      "pending_approvals": 1
    },
    "patients": {
      "total": 247,
      "added_this_month": 35,
      "added_today": 5
    },
    "appointments": {
      "total": 1250,
      "today": 12,
      "pending": 3,
      "completed_this_month": 180
    },
    "prescriptions": {
      "total": 890,
      "this_month": 120,
      "today": 8
    },
    "invoices": {
      "total": 650,
      "unpaid": 15,
      "total_revenue": 450000,
      "revenue_this_month": 45000
    },
    "pdf_usage": {
      "total_used": 245,
      "max_limit": 300,
      "remaining": 55
    }
  }
}
```

---

### #69 POST /api/admin/create-user
**Screen:** Admin Panel → Users → "Add User"
**Note:** Users created by admin are auto-verified (isVerified = true). Can login immediately.

**Request:**
```json
{
  "first_name": "Amit",
  "last_name": "Sharma",
  "email": "amit@doctor.com",
  "phone": "9876543210",
  "password": "Doctor@123",
  "role": "Doctor"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| first_name | string | ✅ | |
| last_name | string | ✅ | |
| email | string | ✅ | Unique |
| phone | string | ❌ | |
| password | string | ✅ | |
| role | string | ✅ | `"Doctor"` or `"Staff"` only |

**✅ 201:**
```json
{
  "status": true,
  "status_code": 201,
  "message": "User created and verified",
  "data": {
    "user_code": "DR0002",
    "first_name": "Amit",
    "last_name": "Sharma",
    "email": "amit@doctor.com",
    "role": "Doctor",
    "isVerified": 1
  }
}
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "All fields are required", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Role must be Doctor or Staff", "data": null }`

**❌ 409:** `{ "status": false, "status_code": 409, "message": "Email already registered", "data": null }`

**Frontend:** Refresh users list. Green toast.

---

### #70 GET /api/admin/users
**Screen:** Admin Panel → Users tab

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Users fetched",
  "data": [
    {
      "user_code": "DR0001",
      "first_name": "Amit",
      "last_name": "Sharma",
      "email": "amit@doctor.com",
      "phone": "9876543210",
      "role": "Doctor",
      "isVerified": 1,
      "last_login_at": "2026-05-19T10:30:00.000Z",
      "created_at": "2026-05-01T08:00:00.000Z"
    },
    {
      "user_code": "ST0001",
      "first_name": "Rahul",
      "last_name": "Kumar",
      "email": "rahul@staff.com",
      "phone": "9988776655",
      "role": "Staff",
      "isVerified": 0,
      "last_login_at": null,
      "created_at": "2026-05-02T09:00:00.000Z"
    }
  ]
}
```

**Frontend:** `isVerified: 1` = ✅ Active. `isVerified: 0` = ⏳ Pending. `last_login_at: null` = Never logged in.

---

### #71 GET /api/admin/users/:user_code
**Screen:** Admin Panel → Users → tap on a user → detail
**URL:** `GET /api/admin/users/DR0001`

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "User fetched",
  "data": {
    "user_code": "DR0001",
    "first_name": "Amit",
    "last_name": "Sharma",
    "email": "amit@doctor.com",
    "phone": "9876543210",
    "role": "Doctor",
    "isVerified": 1,
    "platform": "android",
    "device_type": "mobile",
    "last_login_at": "2026-05-19T10:30:00.000Z",
    "created_at": "2026-05-01T08:00:00.000Z",
    "stats": {
      "total_appointments": 45,
      "total_prescriptions": 32,
      "total_certificates": 8,
      "total_instructions": 5
    }
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

---

### #72 DELETE /api/admin/users/:user_code
**Screen:** Admin Panel → Users → tap "Delete" on a user
**URL:** `DELETE /api/admin/users/DR0002`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "User deleted", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Cannot delete admin", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

---

### #73 GET /api/admin/pending
**Screen:** Admin Panel → Approval Queue

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Pending users fetched",
  "data": [
    {
      "user_code": "DR0002",
      "first_name": "Priya",
      "last_name": "Singh",
      "email": "priya@doctor.com",
      "phone": "9988776655",
      "role": "Doctor",
      "created_at": "2026-05-19T08:00:00.000Z"
    }
  ]
}
```

**✅ 200 Empty:** `{ "status": true, "status_code": 200, "message": "Pending users fetched", "data": [] }`

**Frontend:** Show list with ✅ Approve and ❌ Reject buttons per user.

---

### #74 PATCH /api/admin/approve/:user_code
**Screen:** Approval Queue → tap ✅ Approve
**URL:** `PATCH /api/admin/approve/DR0002`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "User approved successfully", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "User is already verified", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Cannot approve admin", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

**Frontend:** Remove from pending list. Green toast.

---

### #75 PATCH /api/admin/reject/:user_code
**Screen:** Approval Queue → tap ❌ Reject
**URL:** `PATCH /api/admin/reject/DR0002`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "User rejected and removed", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Cannot reject admin", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

**Frontend:** Remove from pending list. Green toast.

---

### #76 GET /api/admin/patients
**Screen:** Admin Panel → Patients tab

**✅ 200:**
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
      "created_at": "2026-05-19T08:00:00.000Z",
      "created_by_name": "Rahul Kumar",
      "created_by_role": "Staff",
      "total_prescriptions": 5,
      "total_appointments": 8,
      "total_invoices": 3
    }
  ]
}
```

---

### #77 GET /api/admin/patients/:patient_code
**Screen:** Admin Panel → Patients → tap on a patient → full detail
**URL:** `GET /api/admin/patients/PT0001`

**✅ 200:**
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
    "created_at": "2026-05-19T08:00:00.000Z",
    "created_by_name": "Rahul Kumar",
    "created_by_role": "Staff",
    "stats": {
      "total_prescriptions": 5,
      "total_certificates": 2,
      "total_instructions": 1,
      "total_consents": 1,
      "total_invoices": 3,
      "total_appointments": 8,
      "total_reminders": 2,
      "unpaid_invoices": 1,
      "total_revenue": 4500
    }
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #78 PATCH /api/admin/reset-limit/:user_code
**Screen:** Admin Panel → PDF Usage → tap "Reset"
**URL:** `PATCH /api/admin/reset-limit/DR0001`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "PDF limit reset successfully", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

---
### #79 PATCH /api/admin/change-password
✅ 200:
json{ "status": true, "status_code": 200, "message": "Password changed successfully", "data": null }
❌ 400:
json{ "status": false, "status_code": 400, "message": "Old password and new password are required", "data": null }
❌ 401:
json{ "status": false, "status_code": 401, "message": "Old password is incorrect", "data": null }
❌ 403:
json{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
Request from Postman:
PATCH /api/admin/change-password
Headers: Authorization: Bearer <admin_token>
Body:
{
  "old_password": "Admin@2026",
  "new_password": "NewAdmin@2026"
}

### #79 PATCH /api/admin/users/:user_code/role
✅ 200 Success:
json{ "status": true, "status_code": 200, "message": "Role updated successfully", "data": { "new_user_code": "DR0004" } }
❌ 400 Invalid role:
json{ "status": false, "status_code": 400, "message": "Role must be Doctor or Staff", "data": null }
❌ 400 Same role:
json{ "status": false, "status_code": 400, "message": "User already has this role", "data": null }
❌ 400 Admin protected:
json{ "status": false, "status_code": 400, "message": "Cannot change admin role", "data": null }
❌ 403 Not admin:
json{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
❌ 404 User not found:
json{ "status": false, "status_code": 404, "message": "User not found", "data": null }
❌ 401 No token:
json{ "status": false, "status_code": 401, "message": "Not authenticated", "data": nul}
PATCH /api/admin/users/ST0001/role
Headers: Authorization: Bearer <admin_token>
Body:
{
  "role": "Doctor"
}



# 🖥️ ADMIN PANEL — Screen Structure

```
Admin Panel
│
├── 📊 Dashboard (#68)
│   └── Stats: doctors, staff, patients, appointments, prescriptions, invoices, revenue, PDF usage
│
├── 👥 Users
│   ├── All Users list (#70)
│   ├── View User detail (#71)        ← tap on row
│   ├── Create User (#69)             ← "Add User" button (auto-verified)
│   └── Delete User (#72)             ← swipe/button
│
├── ✅ Approval Queue
│   ├── Pending Users list (#73)
│   ├── Approve (#74)                 ← ✅ button
│   └── Reject (#75)                  ← ❌ button
│
├── 🏥 Patients
│   ├── All Patients list (#76)       ← with creator info + counts
│   └── View Patient detail (#77)     ← tap on row → full stats
│
└── 📄 PDF Limit
    └── Reset limit (#78)             ← per user
```

---

# 📱 PATIENT PROFILE — Loading All Tabs

```dart
final pc = "PT0001";

final patient       = await api.get("/patients/$pc");          // #11
final prescriptions = await api.get("/prescriptions?patient_code=$pc");  // #24
final certificates  = await api.get("/certificates?patient_code=$pc");   // #35
final instructions  = await api.get("/instructions?patient_code=$pc");   // #40
final consents      = await api.get("/consents?patient_code=$pc");       // #45
final invoices      = await api.get("/invoices?patient_code=$pc");       // #60
final reminders     = await api.get("/reminders?patient_code=$pc");      // #56
final appointments  = await api.get("/appointments?patient_code=$pc");   // #16
```

**Action buttons on patient card:**
```
Prescribe    → POST /api/prescriptions    (#23)  Doctor, Admin
Certificate  → POST /api/certificates    (#34)  Doctor, Admin
Instructions → POST /api/instructions    (#39)  Doctor, Admin
Consent      → POST /api/consents        (#44)  Doctor, Admin
Invoice      → POST /api/invoices        (#59)  Staff, Admin
Appointment  → POST /api/appointments    (#15)  All
Set Reminder → POST /api/reminders       (#55)  All
Records      → GET /api/records          (#67)  All
```

---

# 🔑 ROLE-BASED VISIBILITY

```dart
final r = user.role; // "Admin", "Doctor", "Staff"

// Patient actions
bool canPrescribe     = r == 'Doctor' || r == 'Admin';
bool canCertificate   = r == 'Doctor' || r == 'Admin';
bool canInstruction   = r == 'Doctor' || r == 'Admin';
bool canConsent       = r == 'Doctor' || r == 'Admin';
bool canInvoice       = r == 'Staff'  || r == 'Admin';
bool canBookAppt      = true;  // All roles
bool canSetReminder   = true;  // All roles
bool canEditPatient   = r == 'Staff'  || r == 'Admin';
bool canDeletePatient = r == 'Staff'  || r == 'Admin';

// Admin panel
bool showAdminPanel   = r == 'Admin';
bool canCreateUser    = r == 'Admin';
bool canApproveUsers  = r == 'Admin';
bool canDeleteUser    = r == 'Admin';
bool canResetPdfLimit = r == 'Admin';

// Appointment form
bool showDoctorDropdown = r != 'Doctor'; // Doctor auto-selects self
```

---

# ⚠️ GLOBAL ERRORS (apply to ALL endpoints)

```json
// 401 — No token or missing Bearer
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
// Frontend: Clear tokens → Login

// 401 — Expired token
{ "status": false, "status_code": 401, "message": "Token expired or invalid", "data": null }
// Frontend: Clear tokens → Login

// 403 — Wrong role
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
// Frontend: Show toast. Don't redirect.

// 500 — Server error
{ "status": false, "status_code": 500, "message": "Something went wrong", "data": null }
// Frontend: Show "Something went wrong. Please try again."
```

---

# 🎨 TOAST COLORS

| Code | Color | Action |
|------|-------|--------|
| 200 | 🟢 Green | Refresh data |
| 201 | 🟢 Green | Refresh + navigate |
| 400 | 🔴 Red | Show message |
| 401 | 🔴 Red | Clear tokens → Login |
| 403 | 🟠 Orange | Show message |
| 404 | 🔴 Red | Show message |
| 409 | 🟠 Orange | Show message |
| 429 | 🟠 Orange | "Contact admin" dialog |
| 500 | 🔴 Red | "Something went wrong" |

---

# 📊 FULL ENDPOINT TABLE

| # | Method | URL | Who |
|---|--------|-----|-----|
| | **AUTH** | | |
| 1 | POST | /api/auth/register | Anyone |
| 2 | POST | /api/auth/login | Anyone |
| 3 | POST | /api/auth/forgot-password | Anyone |
| 4 | POST | /api/auth/verify-otp | Anyone |
| 5 | POST | /api/auth/reset-password | Anyone |
| 6 | GET | /api/auth/me | All |
| 7 | POST | /api/auth/logout | All |
| 8 | GET | /api/auth/doctors | All |
| | **PATIENT** | | |
| 9 | POST | /api/patients | All |
| 10 | GET | /api/patients | All |
| 11 | GET | /api/patients/:patient_code | All |
| 12 | PUT | /api/patients/:patient_code | Admin, Staff |
| 13 | DELETE | /api/patients/:patient_code | Admin, Staff |
| 14 | GET | /api/patients/search?q= | All |
| | **APPOINTMENT** | | |
| 15 | POST | /api/appointments | All |
| 16 | GET | /api/appointments | All |
| 17 | GET | /api/appointments/today | All |
| 18 | GET | /api/appointments/calendar?month= | All |
| 19 | GET | /api/appointments/:id | All |
| 20 | PUT | /api/appointments/:id | All |
| 21 | PATCH | /api/appointments/:id/status | All |
| 22 | DELETE | /api/appointments/:id | All |
| | **PRESCRIPTION** | | |
| 23 | POST | /api/prescriptions | Doctor, Admin |
| 24 | GET | /api/prescriptions | All |
| 25 | GET | /api/prescriptions/:id | All |
| 26 | PUT | /api/prescriptions/:id | Doctor(own), Admin |
| 27 | DELETE | /api/prescriptions/:id | Doctor(own), Admin |
| 28 | POST | /api/prescriptions/:id/medicines | Doctor(own), Admin |
| 29 | PUT | /api/prescriptions/:id/medicines/:mid | Doctor(own), Admin |
| 30 | DELETE | /api/prescriptions/:id/medicines/:mid | Doctor(own), Admin |
| 31 | POST | /api/prescriptions/:id/lab-tests | Doctor(own), Admin |
| 32 | PUT | /api/prescriptions/:id/lab-tests/:lid | Doctor(own), Admin |
| 33 | DELETE | /api/prescriptions/:id/lab-tests/:lid | Doctor(own), Admin |
| | **CERTIFICATE** | | |
| 34 | POST | /api/certificates | Doctor, Admin |
| 35 | GET | /api/certificates | All |
| 36 | GET | /api/certificates/:id | All |
| 37 | PUT | /api/certificates/:id | Doctor(own), Admin |
| 38 | DELETE | /api/certificates/:id | Doctor(own), Admin |
| | **INSTRUCTION** | | |
| 39 | POST | /api/instructions | Doctor, Admin |
| 40 | GET | /api/instructions | All |
| 41 | GET | /api/instructions/:id | All |
| 42 | PUT | /api/instructions/:id | Doctor(own), Admin |
| 43 | DELETE | /api/instructions/:id | Doctor(own), Admin |
| | **CONSENT** | | |
| 44 | POST | /api/consents | Doctor, Admin |
| 45 | GET | /api/consents | All |
| 46 | GET | /api/consents/:id | All |
| 47 | PUT | /api/consents/:id | Doctor(own), Admin |
| 48 | DELETE | /api/consents/:id | Doctor(own), Admin |
| | **TEMPLATE** | | |
| 49 | POST | /api/templates | Doctor, Admin |
| 50 | GET | /api/templates | Doctor, Admin |
| 51 | GET | /api/templates/:id | Doctor, Admin |
| 52 | GET | /api/templates/search?type=&q= | Doctor, Admin |
| 53 | PUT | /api/templates/:id | Doctor(own), Admin |
| 54 | DELETE | /api/templates/:id | Doctor(own), Admin |
| | **REMINDER** | | |
| 55 | POST | /api/reminders | All |
| 56 | GET | /api/reminders | All |
| 57 | PUT | /api/reminders/:id | All |
| 58 | DELETE | /api/reminders/:id | All |
| | **INVOICE** | | |
| 59 | POST | /api/invoices | Staff, Admin |
| 60 | GET | /api/invoices | Staff, Admin |
| 61 | GET | /api/invoices/:id | Staff, Admin |
| 62 | PUT | /api/invoices/:id | Staff, Admin |
| 63 | PATCH | /api/invoices/:id/status | Staff, Admin |
| 64 | DELETE | /api/invoices/:id | Staff, Admin |
| 65 | POST | /api/invoices/:id/items | Staff, Admin |
| 66 | DELETE | /api/invoices/:id/items/:itemId | Staff, Admin |
| | **RECORDS** | | |
| 67 | GET | /api/records?patient_code=&search= | All |
| | **ADMIN PANEL** | | |
| 68 | GET | /api/admin/dashboard | Admin |
| 69 | POST | /api/admin/create-user | Admin |
| 70 | GET | /api/admin/users | Admin |
| 71 | GET | /api/admin/users/:user_code | Admin |
| 72 | DELETE | /api/admin/users/:user_code | Admin |
| 73 | GET | /api/admin/pending | Admin |
| 74 | PATCH | /api/admin/approve/:user_code | Admin |
| 75 | PATCH | /api/admin/reject/:user_code | Admin |
| 76 | GET | /api/admin/patients | Admin |
| 77 | GET | /api/admin/patients/:patient_code | Admin |
| 78 | PATCH | /api/admin/change-password | Admin |

---

| Module | Count |
|--------|-------|
| Auth | 8 |
| Patient | 6 |
| Appointment | 8 |
| Prescription + Medicine + Lab | 11 |
| Certificate | 5 |
| Instruction | 5 |
| Consent | 5 |
| Template | 6 |
| Reminder | 4 |
| Invoice + Items | 8 |
| Records | 1 |
| Admin Panel | 11 |
| **TOTAL** | **78** |

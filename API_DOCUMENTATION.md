# VimPal Smart Clinic — API Documentation v4 (FINAL)

**Base URL:** `https://adixonclinicos.info/api`
**Total Endpoints:** 81 | **Tables:** 14 | **Roles:** Admin, Doctor, Staff

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

## Auth Header (required on all except #1–#5, #7)
```
Authorization: Bearer <accessToken>
```

## Token Expiry
- `accessToken` → 7 days
- `refreshToken` → 30 days
- On any 401 → interceptor tries refresh-token → if fails → clear tokens → Login

---

# 🔐 AUTH (9 Endpoints)

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
| role | string | ✅ | `"Doctor"` or `"Staff"` only. Default `"Staff"` on frontend. |
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

**Frontend:** Show success → "Waiting for approval" screen. Do NOT auto-login. User cannot login until admin approves.

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

**Frontend:** On 401 → interceptor tries refresh → if fails → clear tokens → Login screen.

---

### #7 POST /api/auth/refresh-token
**Who:** Anyone (no auth header needed) | **When:** Auto-called by interceptor when accessToken expires

**Request:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

**✅ 200:**
```json
{ "status": true, "status_code": 200, "message": "Token refreshed", "data": { "accessToken": "eyJhbGciOiJIUzI1NiIs..." } }
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Refresh token is required", "data": null }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Invalid refresh token", "data": null }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Refresh token expired. Please login again.", "data": null }`

**Frontend:** Never call manually. Axios/Dio interceptor handles it automatically:
```
API call → 401 → interceptor catches → POST /refresh-token → new accessToken → retry original request
                                      → refresh fails → clear storage → Login screen
```

---

### #8 POST /api/auth/logout
**Who:** All logged in | **Screen:** Settings → "Logout"

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Logged out successfully", "data": null }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }`

**Frontend:** Clear all tokens + user data → Login screen.

---

### #9 GET /api/auth/doctors
**Who:** All logged in (Admin, Doctor, Staff all need this)
**When:** Appointment form → Doctor dropdown | Patient form (Staff/Admin) → Doctor dropdown
**Why in /auth/ not /admin/:** Staff and Doctor also need this for booking appointments and adding patients.

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

**Frontend — Doctor dropdown:**
```dart
DropdownButton(
  value: selectedDoctorCode,
  items: doctors.map((d) => DropdownMenuItem(
    value: d['user_code'],                                    // sent to API
    child: Text("Dr. ${d['first_name']} ${d['last_name']}"),  // shown to user
  )).toList(),
  onChanged: (code) => selectedDoctorCode = code,
)
```
User sees **"Dr. Amit Sharma"** → API receives `"DR0001"`. User never sees codes.

---

# 👤 PATIENT (6 Endpoints)

---

### #10 POST /api/patients
**Who:** All | **Screen:** Patient list → "+" → fill form → "Save"
**Note:** Doctor creating patient → auto-assigns self. Staff/Admin → must pick doctor from dropdown.

**Request (Doctor — auto-assigns self, no doctor_code needed):**
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

**Request (Staff/Admin — must include doctor_code):**
```json
{
  "first_name": "Rajesh",
  "last_name": "Verma",
  "phone": "9988776655",
  "gender": "Male",
  "age": 35,
  "doctor_code": "DR0001"
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
| doctor_code | string | ❌ | Required for Staff/Admin. Auto-self for Doctor. From dropdown (#9). |

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

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Doctor not found", "data": null }`

**Frontend:** If `user.role == 'Doctor'` → hide doctor dropdown (auto-assigns). If Staff/Admin → show doctor dropdown from `GET /api/auth/doctors` (#9).

---

### #11 GET /api/patients
**Who:** All | **Screen:** Patient list + Patient dropdown in forms
**Note:** Doctor sees only their own patients (auto-filtered by JWT token). Admin/Staff see all or filter by doctor.

**Query Params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| doctor_code | string | ❌ | Admin/Staff: filter patients by doctor. Doctor: ignored (auto-filtered). |

**Usage:**
```
GET /api/patients                          → Doctor sees only theirs. Admin/Staff sees all.
GET /api/patients?doctor_code=DR0001       → Admin/Staff sees only DR0001's patients.
```

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

**Frontend — Patient dropdown:**
```dart
SearchableDropdown(
  items: patients.map((p) => DropdownMenuItem(
    value: p['patient_code'],                                              // sent to API
    child: Text("${p['first_name']} ${p['last_name']} - ${p['phone'] ?? ''}"),  // shown to user
  )).toList(),
  onChanged: (code) => selectedPatientCode = code,
)
```

---

### #12 GET /api/patients/:patient_code
**Who:** All | **URL:** `GET /api/patients/PT0001`
**Note:** Doctor can only view their own patients. Returns 404 if patient belongs to another doctor.

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
    "doctor_name": "Amit Sharma",
    "doctor_code": "DR0001"
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #13 PUT /api/patients/:patient_code
**Who:** Admin, Staff (NOT Doctor) | **URL:** `PUT /api/patients/PT0001`

**Request:** Same fields as #10.

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Patient updated", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

**Frontend:** Hide edit button if `user.role == 'Doctor'`.

---

### #14 DELETE /api/patients/:patient_code
**Who:** Admin, Staff (NOT Doctor)

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Patient deleted", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

---

### #15 GET /api/patients/search?q=rajesh
**Who:** All | **Screen:** Patient search bar → type → live results
**Note:** Doctor search is auto-filtered to their own patients only.

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

**Frontend:** Debounce 300ms. Max 20 results.

---

# 📅 APPOINTMENT (8 Endpoints)

---

### #16 POST /api/appointments
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
| doctor_code | string | ❌ | From doctor dropdown (#9). Auto-self if Doctor. Required if Staff/Admin. |
| patient_code | string | ❌ | From patient dropdown (#11). If missing = walk-in |
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
final doctors  = await api.get("/auth/doctors");   // #9
final patients = await api.get("/patients");        // #11
// Doctor dropdown → shows "Dr. Amit Sharma" → holds "DR0001"
// Patient dropdown → shows "Rajesh Verma - 9988776655" → holds "PT0001"
// Toggle [Existing Patient] ←→ [Walk-in]
// If user.role == 'Doctor' → auto-select self, hide doctor dropdown
```

---

### #17 GET /api/appointments
**Who:** All | **Query:** `?patient_code=PT0001` | `?filter=today` | `?filter=history` | `?filter=upcoming` | `?sort=oldest`

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

**Frontend:** `is_walkin: 1` → "Walk-in" badge. `patient_code: null` → no profile link. Doctor sees only own appointments.

---

### #18 GET /api/appointments/today

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Today's appointments fetched",
  "data": [{ "id": 1, "patient_name": "Rajesh Verma", "patient_code": "PT0001", "appointment_time": "10:00:00", "purpose": "Fever", "status": "Pending", "is_walkin": 0 }]
}
```

---

### #19 GET /api/appointments/calendar?month=2026-05

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Calendar appointments fetched",
  "data": {
    "2026-05-19": [{ "id": 1, "patient_name": "Rajesh Verma", "patient_code": "PT0001", "appointment_date": "2026-05-19", "appointment_time": "10:00:00", "status": "Confirmed" }],
    "2026-05-20": [{ "id": 2, "patient_name": "Walk-in Patient", "patient_code": null, "appointment_date": "2026-05-20", "appointment_time": "14:00:00", "status": "Pending" }]
  }
}
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Month parameter is required (YYYY-MM)", "data": null }`

---

### #20 GET /api/appointments/:id

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Appointment fetched",
  "data": {
    "id": 1, "patient_name": "Rajesh Kumar Verma", "patient_gender": "Male", "patient_age": 35, "patient_age_unit": "Year", "patient_dob": "1990-05-15", "patient_whatsapp": "9988776655", "patient_email": "rajesh@email.com",
    "appointment_date": "2026-05-20", "appointment_time": "10:00:00", "purpose": "Fever", "notes": "Called in advance", "status": "Pending",
    "patient_code": "PT0001", "doctor_name": "Amit Sharma", "doctor_code": "DR0001", "booked_by_name": "Rahul Kumar", "is_walkin": 0,
    "created_at": "2026-05-19T08:00:00.000Z", "updated_at": "2026-05-19T08:00:00.000Z"
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }`

---

### #21 PUT /api/appointments/:id

**Request:** Same fields as #16.

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Appointment updated", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }`

---

### #22 PATCH /api/appointments/:id/status

**Request:** `{ "status": "Confirmed" }` → Valid: `"Pending"` | `"Confirmed"` | `"Completed"` | `"Cancelled"`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Status updated", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }`

---

### #23 DELETE /api/appointments/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Appointment deleted", "data": null }`

---

# 💊 PRESCRIPTION (11 Endpoints) — PDF Limit on Create

---

### #24 POST /api/prescriptions
**Who:** Doctor, Admin | **PDF Limit:** 300 total across prescriptions + certificates + instructions

**Request:**
```json
{
  "patient_code": "PT0001",
  "appointment_id": 1,
  "temperature": "98.6", "height": "175", "weight": "72", "pulse": "78",
  "blood_pressure": "120/80", "blood_sugar": "110", "hemoglobin": "13.5", "spo2": "98", "respiration_rate": "18",
  "allergy": "Penicillin", "chief_complaint": "Skin patches on arms", "history": "Started 3 months ago",
  "findings": "White patches on both arms", "diagnosis": "Vitiligo", "treatment_advice": "Apply cream daily",
  "end_note": "Review after 30 days", "follow_up_date": "2026-06-19", "notes": "Internal note", "prescription_date": "2026-05-19"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| patient_code | string | ✅ | From patient dropdown |
| appointment_id | integer | ❌ | Link to appointment |
| temperature, height, weight, pulse, blood_pressure, blood_sugar, hemoglobin, spo2, respiration_rate | string | ❌ | 9 vitals — all optional |
| allergy, chief_complaint, history, findings, diagnosis, treatment_advice, end_note | string | ❌ | 7 case history — all optional |
| follow_up_date | string | ❌ | `YYYY-MM-DD` |
| notes | string | ❌ | Internal, not on PDF |
| prescription_date | string | ❌ | `YYYY-MM-DD` |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Prescription created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 429:** `{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }`

**Frontend Flow:** Fill form → add medicines/tests locally → preview PDF → "Approve & Share" → POST prescription → POST medicines (loop) → POST lab-tests (loop).

---

### #25 GET /api/prescriptions
**Query:** `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Prescriptions fetched",
  "data": [{ "id": 1, "diagnosis": "Vitiligo", "chief_complaint": "Skin patches", "prescription_date": "2026-05-19", "follow_up_date": "2026-06-19", "created_at": "...", "doctor_name": "Amit Sharma", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001" }]
}
```

---

### #26 GET /api/prescriptions/:id
Returns full data + medicines[] + lab_tests[] for PDF.

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Prescription fetched",
  "data": {
    "id": 1,
    "temperature": "98.6", "height": "175", "weight": "72", "pulse": "78",
    "blood_pressure": "120/80", "blood_sugar": "110", "hemoglobin": "13.5", "spo2": "98", "respiration_rate": "18",
    "allergy": "Penicillin", "chief_complaint": "Skin patches", "history": "3 months",
    "findings": "White patches", "diagnosis": "Vitiligo", "treatment_advice": "Apply cream",
    "end_note": "Review after 30 days", "follow_up_date": "2026-06-19", "prescription_date": "2026-05-19",
    "doctor_name": "Amit Sharma", "patient_name": "Rajesh Kumar Verma",
    "patient_code": "PT0001", "gender": "Male", "age": 35, "patient_phone": "9988776655", "city": "Patna",
    "medicines": [
      { "id": 1, "name": "Charak Pigmento", "total_quantity": "1", "frequency": "1-0-1", "route_form": "Topical", "no_of_days": "30", "instructions": "After food", "additional_comments": "Sun exposure 15 mins" }
    ],
    "lab_tests": [
      { "id": 1, "test_name": "CBC", "additional_comments": "Check infection" }
    ]
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Prescription not found", "data": null }`

---

### #27 PUT /api/prescriptions/:id — Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Prescription updated", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #28 DELETE /api/prescriptions/:id — Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Prescription deleted", "data": null }`

**❌ 403 / 404:** Same as #27.

---

### #29 POST /api/prescriptions/:id/medicines

**Request:** `{ "name": "Tab Paracetamol 500mg", "total_quantity": "10", "frequency": "1-0-1", "route_form": "Oral", "no_of_days": "5", "instructions": "After food", "additional_comments": "If fever persists" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Medicine added", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Medicine name is required", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

### #30 PUT /api/prescriptions/:id/medicines/:medicineId
**✅ 200:** `{ "status": true, "status_code": 200, "message": "Medicine updated", "data": null }`
**❌ 404:** `{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }`

### #31 DELETE /api/prescriptions/:id/medicines/:medicineId
**✅ 200:** `{ "status": true, "status_code": 200, "message": "Medicine deleted", "data": null }`
**❌ 404:** `{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }`

---

### #32 POST /api/prescriptions/:id/lab-tests

**Request:** `{ "test_name": "CBC", "additional_comments": "Check infection" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Lab test added", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Test name is required", "data": null }`

### #33 PUT /api/prescriptions/:id/lab-tests/:labTestId
**✅ 200:** `{ "status": true, "status_code": 200, "message": "Lab test updated", "data": null }`
**❌ 404:** `{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }`

### #34 DELETE /api/prescriptions/:id/lab-tests/:labTestId
**✅ 200:** `{ "status": true, "status_code": 200, "message": "Lab test deleted", "data": null }`
**❌ 404:** `{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }`

---

# 📜 CERTIFICATE (5 Endpoints) — PDF Limit

---

### #35 POST /api/certificates
**Who:** Doctor, Admin

**Request:** `{ "patient_code": "PT0001", "title": "Medical Certificate", "description": "This is to certify...", "certificate_date": "2026-05-19" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Certificate created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 429:** `{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }`

### #36 GET /api/certificates — `?patient_code=PT0001` | `?sort=oldest`
### #37 GET /api/certificates/:id
### #38 PUT /api/certificates/:id — Doctor (own), Admin
### #39 DELETE /api/certificates/:id — Doctor (own), Admin

Same response patterns as prescriptions.

---

# 📋 INSTRUCTION (5 Endpoints) — PDF Limit

---

### #40 POST /api/instructions

**Request:** `{ "patient_code": "PT0001", "title": "Epley Maneuver", "description": "Step 1: Sit on bed...", "instruction_date": "2026-05-19" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Instruction created", "data": { "id": 1 } }`

**❌ 400 / 404 / 429:** Same as certificates.

### #41 GET /api/instructions — `?patient_code=PT0001` | `?sort=oldest`
### #42 GET /api/instructions/:id
### #43 PUT /api/instructions/:id — Doctor (own), Admin
### #44 DELETE /api/instructions/:id — Doctor (own), Admin

---

# ✍️ CONSENT (5 Endpoints) — No PDF Limit

---

### #45 POST /api/consents

**Request:** `{ "patient_code": "PT0001", "title": "Surgery Consent", "description": "I hereby consent...", "consent_date": "2026-05-19" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Consent created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

### #46 GET /api/consents — `?patient_code=PT0001` | `?sort=oldest`
### #47 GET /api/consents/:id
### #48 PUT /api/consents/:id — Doctor (own), Admin
### #49 DELETE /api/consents/:id — Doctor (own), Admin

---

# 📝 TEMPLATE (6 Endpoints)

---

### #50 POST /api/templates
**Who:** Doctor, Admin

Types: `"Medicine"` | `"Lab Test"` | `"Instruction"` | `"Certificate"`

**Request (Medicine):**
```json
{
  "type": "Medicine",
  "title": "Viral Fever - Adult",
  "content": "[{\"name\":\"Tab Paracetamol 500mg\",\"total_quantity\":\"10\",\"frequency\":\"1-0-1\",\"route_form\":\"Oral\",\"no_of_days\":\"5\",\"instructions\":\"After food\",\"additional_comments\":\"If fever persists\"}]"
}
```

**Request (Lab Test):**
```json
{
  "type": "Lab Test",
  "title": "Female Infertility Panel",
  "content": "[{\"test_name\":\"FSH\",\"additional_comments\":\"Day 2-3 of cycle\"},{\"test_name\":\"LH\",\"additional_comments\":\"Day 2-3 of cycle\"}]"
}
```

**Request (Instruction):**
```json
{
  "type": "Instruction",
  "title": "Epley Maneuver for BPPV",
  "content": "{\"title\":\"Epley Maneuver for BPPV\",\"description\":\"Step 1: Sit on bed...\"}"
}
```

**Request (Certificate):**
```json
{
  "type": "Certificate",
  "title": "Fitness Certificate",
  "content": "{\"title\":\"Fitness Certificate\",\"description\":\"This is to certify that Mr/Mrs _____ has been examined...\"}"
}
```

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Template created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Type, title and content are required", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Type must be Medicine, Lab Test, Instruction or Certificate", "data": null }`

**Template content format:**

| Type | `content` stores | Frontend parses with |
|------|-----------------|---------------------|
| Medicine | `[{name, total_quantity, frequency, route_form, no_of_days, instructions, additional_comments}]` | `jsonDecode()` → List |
| Lab Test | `[{test_name, additional_comments}]` | `jsonDecode()` → List |
| Instruction | `{title, description}` | `jsonDecode()` → Map |
| Certificate | `{title, description}` | `jsonDecode()` → Map |

---

### #51 GET /api/templates — `?type=Medicine` | `?type=Lab Test` | `?type=Instruction` | `?type=Certificate`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Templates fetched",
  "data": [{ "id": 1, "type": "Medicine", "title": "Viral Fever - Adult", "content": "[{...}]", "created_at": "...", "created_by_name": "Amit Sharma" }]
}
```

### #52 GET /api/templates/:id
### #53 GET /api/templates/search?type=Medicine&q=vitiligo
### #54 PUT /api/templates/:id — Doctor (own), Admin
### #55 DELETE /api/templates/:id

---

# 🔔 REMINDER (4 Endpoints)

---

### #56 POST /api/reminders
**Who:** All

**Request (Reminder):** `{ "patient_code": "PT0001", "reminder_type": "Reminder", "title": "Follow-up", "description": "Take meds", "start_date": "2026-05-19", "end_date": "2026-05-26" }`

**Request (Payment):** `{ "patient_code": "PT0001", "reminder_type": "Payment Reminder", "title": "Payment due", "payment_link": "https://pay.example.com/123", "start_date": "2026-05-19", "end_date": "2026-05-24" }`

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Reminder created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code and title are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

### #57 GET /api/reminders — `?patient_code=PT0001` | `?reminder_type=Payment Reminder`
### #58 PUT /api/reminders/:id — mark done: `{ "is_done": true }`
### #59 DELETE /api/reminders/:id

---

# 🧾 INVOICE (8 Endpoints)

---

### #60 POST /api/invoices
**Who:** Staff, Admin (NOT Doctor)

**Request:**
```json
{
  "patient_code": "PT0001", "bill_to_name": "Rajesh Verma", "invoice_title": "Invoice", "currency": "INR",
  "discount_title": "Discount", "discount_value": 100, "discount_type": "Amount",
  "advance_title": "Amount Paid", "advance_amount": 500,
  "tax_title": "GST", "tax_value": 18, "tax_type": "Percentage",
  "remark": "Consultation", "invoice_date": "2026-05-19", "status": "To pay"
}
```

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Invoice created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

### #61 GET /api/invoices — `?patient_code=PT0001` | `?sort=oldest`

### #62 GET /api/invoices/:id — returns invoice + items[]

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Invoice fetched",
  "data": {
    "id": 1, "bill_to_name": "Rajesh Verma", "invoice_title": "Invoice", "currency": "INR",
    "discount_title": "Discount", "discount_value": "100.00", "discount_type": "Amount",
    "advance_title": "Amount Paid", "advance_amount": "500.00",
    "tax_title": "GST", "tax_value": "18.00", "tax_type": "Percentage",
    "total_amount": "1170.00", "status": "To pay",
    "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001",
    "items": [
      { "id": 1, "description": "Consultation", "amount": "500.00" },
      { "id": 2, "description": "Lab Tests", "amount": "1000.00" }
    ]
  }
}
```

**Total formula:** `items_total + tax - discount - advance`

### #63 PUT /api/invoices/:id — auto-recalculates total
### #64 PATCH /api/invoices/:id/status — `{ "status": "Paid" }` Valid: `To pay`, `Paid`, `None`
### #65 DELETE /api/invoices/:id

### #66 POST /api/invoices/:id/items — auto-recalculates total
**Request:** `{ "description": "Consultation Fee", "amount": 500 }`
**✅ 201:** `{ "status": true, "status_code": 201, "message": "Item added", "data": { "id": 1 } }`
**❌ 400:** `{ "status": false, "status_code": 400, "message": "Description and amount are required", "data": null }`

### #67 DELETE /api/invoices/:id/items/:itemId — auto-recalculates total
**✅ 200:** `{ "status": true, "status_code": 200, "message": "Item deleted", "data": null }`
**❌ 404:** `{ "status": false, "status_code": 404, "message": "Item not found", "data": null }`

---

# 🔍 RECORDS — Combined Patient View (1 Endpoint)

---

### #68 GET /api/records?patient_code=PT0001&search=fever
**Who:** All | **Screen:** Patient profile → "Records" tab

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Records fetched",
  "data": {
    "prescriptions": [{ "id": 1, "diagnosis": "Vitiligo", "prescription_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "certificates": [{ "id": 1, "title": "Medical Certificate", "certificate_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "instructions": [{ "id": 1, "title": "Epley Maneuver", "instruction_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "consents": [{ "id": 1, "title": "Surgery Consent", "consent_date": "2026-05-19", "doctor_name": "Amit Sharma" }],
    "invoices": [{ "id": 1, "invoice_title": "Invoice", "total_amount": "1170.00", "status": "To pay" }],
    "appointments": [{ "id": 1, "appointment_date": "2026-05-20", "purpose": "Fever", "status": "Confirmed", "doctor_name": "Amit Sharma" }],
    "reminders": [{ "id": 1, "title": "Follow-up", "start_date": "2026-05-19", "is_done": 0 }]
  }
}
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "patient_code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

# 🛡️ ADMIN PANEL (13 Endpoints) — Admin Only

**All endpoints below return ❌ 403** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }` for non-admin users.

---

### #69 GET /api/admin/dashboard

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Admin dashboard",
  "data": {
    "users": { "total_doctors": 3, "total_staff": 2, "pending_approvals": 1 },
    "patients": { "total": 247, "added_this_month": 35, "added_today": 5 },
    "appointments": { "total": 1250, "today": 12, "pending": 3, "completed_this_month": 180 },
    "prescriptions": { "total": 890, "this_month": 120, "today": 8 },
    "invoices": { "total": 650, "unpaid": 15, "total_revenue": 450000, "revenue_this_month": 45000 },
    "pdf_usage": { "total_used": 245, "max_limit": 300, "remaining": 55 }
  }
}
```

---

### #70 POST /api/admin/create-user
**Note:** Auto-verified (isVerified = true). Can login immediately.

**Request:**
```json
{ "first_name": "Amit", "last_name": "Sharma", "email": "amit@doctor.com", "phone": "9876543210", "password": "Doctor@123", "role": "Doctor" }
```

**✅ 201:**
```json
{ "status": true, "status_code": 201, "message": "User created and verified", "data": { "user_code": "DR0002", "first_name": "Amit", "last_name": "Sharma", "email": "amit@doctor.com", "role": "Doctor", "isVerified": 1 } }
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "All fields are required", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Role must be Doctor or Staff", "data": null }`

**❌ 409:** `{ "status": false, "status_code": 409, "message": "Email already registered", "data": null }`

---

### #71 GET /api/admin/users
**Query:** `?status=approved` | `?status=pending` | `?status=rejected`

**Usage:**
```
GET /api/admin/users                    → All active users (default)
GET /api/admin/users?status=approved    → ✅ Verified users only
GET /api/admin/users?status=pending     → ⏳ Waiting for approval
GET /api/admin/users?status=rejected    → ❌ Rejected/deleted users
```

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Users fetched",
  "data": [
    { "user_code": "DR0001", "first_name": "Amit", "last_name": "Sharma", "email": "amit@doctor.com", "phone": "9876543210", "role": "Doctor", "isVerified": 1, "isDeleted": 0, "last_login_at": "2026-05-19T10:30:00.000Z", "created_at": "2026-05-01T08:00:00.000Z" }
  ]
}
```

**Frontend:** Use tabs — All | Approved | Pending | Rejected. `isVerified: 1` = ✅ Active. `isVerified: 0` = ⏳ Pending. `last_login_at: null` = Never logged in.

---

### #72 GET /api/admin/users/:user_code
**URL:** `GET /api/admin/users/DR0001`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "User fetched",
  "data": {
    "user_code": "DR0001", "first_name": "Amit", "last_name": "Sharma", "email": "amit@doctor.com", "phone": "9876543210",
    "role": "Doctor", "isVerified": 1, "platform": "android", "device_type": "mobile",
    "last_login_at": "2026-05-19T10:30:00.000Z", "created_at": "2026-05-01T08:00:00.000Z",
    "stats": { "total_appointments": 45, "total_prescriptions": 32, "total_certificates": 8, "total_instructions": 5 }
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

**Frontend:** Admin taps on a doctor → sees detail + stats. "View Patients" button → `GET /api/patients?doctor_code=DR0001`

---

### #73 DELETE /api/admin/users/:user_code
**URL:** `DELETE /api/admin/users/DR0002`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "User deleted", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Cannot delete admin", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

---

### #74 GET /api/admin/pending

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Pending users fetched",
  "data": [{ "user_code": "DR0002", "first_name": "Priya", "last_name": "Singh", "email": "priya@doctor.com", "phone": "9988776655", "role": "Doctor", "created_at": "2026-05-19T08:00:00.000Z" }]
}
```

**✅ 200 Empty:** `{ "status": true, "status_code": 200, "message": "Pending users fetched", "data": [] }`

**Note:** Same as `GET /api/admin/users?status=pending`. This endpoint kept for backward compatibility.

---

### #75 PATCH /api/admin/approve/:user_code
**URL:** `PATCH /api/admin/approve/DR0002`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "User approved successfully", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "User is already verified", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Cannot approve admin", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

---

### #76 PATCH /api/admin/reject/:user_code
**URL:** `PATCH /api/admin/reject/DR0002`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "User rejected and removed", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Cannot reject admin", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

---

### #77 GET /api/admin/patients

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Patients fetched",
  "data": [
    { "patient_code": "PT0001", "first_name": "Rajesh", "middle_name": "Kumar", "last_name": "Verma", "phone": "9988776655", "gender": "Male", "age": 35, "blood_group": "B+", "city": "Patna", "created_at": "...", "created_by_name": "Rahul Kumar", "created_by_role": "Staff", "total_prescriptions": 5, "total_appointments": 8, "total_invoices": 3 }
  ]
}
```

---

### #78 GET /api/admin/patients/:patient_code
**URL:** `GET /api/admin/patients/PT0001`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Patient fetched",
  "data": {
    "patient_code": "PT0001", "first_name": "Rajesh", "middle_name": "Kumar", "last_name": "Verma",
    "email": "rajesh@patient.com", "phone": "9988776655", "date_of_birth": "1990-05-15", "age": 35, "gender": "Male", "blood_group": "B+",
    "street_address": "42 MG Road", "city": "Patna", "state": "Bihar", "zip_code": "800001",
    "created_at": "...", "created_by_name": "Rahul Kumar", "created_by_role": "Staff",
    "stats": {
      "total_prescriptions": 5, "total_certificates": 2, "total_instructions": 1, "total_consents": 1,
      "total_invoices": 3, "total_appointments": 8, "total_reminders": 2, "unpaid_invoices": 1, "total_revenue": 4500
    }
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #79 PATCH /api/admin/change-password
**Screen:** Admin Panel → Settings → Change Password

**Request:**
```json
{ "old_password": "Admin@2026", "new_password": "NewAdmin@2026" }
```

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Password changed successfully", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Old password and new password are required", "data": null }`

**❌ 401:** `{ "status": false, "status_code": 401, "message": "Old password is incorrect", "data": null }`

---

### #80 PATCH /api/admin/users/:user_code/role
**Screen:** Admin Panel → Users → User Detail → Change Role
**URL:** `PATCH /api/admin/users/ST0001/role`

**Request:** `{ "role": "Doctor" }`

**✅ 200:**
```json
{ "status": true, "status_code": 200, "message": "Role updated successfully", "data": { "new_user_code": "DR0004" } }
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Role must be Doctor or Staff", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "User already has this role", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Cannot change admin role", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

**Frontend:** After success, refresh user list — old code gone, new code assigned.

---

### #81 PATCH /api/admin/reset-limit/:user_code
**URL:** `PATCH /api/admin/reset-limit/DR0001`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "PDF limit reset successfully", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

---

# 🖥️ ADMIN PANEL — Screen Structure

```
Admin Panel
│
├── 📊 Dashboard (#69)
│   └── Stats cards: doctors, staff, patients, appointments, prescriptions, invoices, revenue, PDF usage
│
├── 👥 Users
│   ├── All Users (#71)                ← tabs: All | Approved | Pending | Rejected (?status=)
│   ├── View User (#72)               ← tap on row → detail + stats
│   ├── Create User (#70)             ← "Add User" button (auto-verified)
│   ├── Delete User (#73)             ← swipe/button
│   ├── Change Role (#80)             ← Doctor ↔ Staff (code auto-updates)
│   └── View Doctor's Patients        → GET /api/patients?doctor_code=DR0001
│
├── ✅ Approval Queue
│   ├── Pending list (#74)            ← or use #71 ?status=pending
│   ├── Approve (#75)                 ← ✅ button
│   └── Reject (#76)                  ← ❌ button
│
├── 🏥 Patients
│   ├── All Patients (#77)            ← with creator info + counts
│   └── View Patient (#78)            ← tap on row → full stats
│
├── 🔒 Settings
│   └── Change Password (#79)
│
└── 📄 PDF Limit
    └── Reset limit (#81)             ← per user
```

---

# 📱 PATIENT PROFILE — Loading All Tabs

```dart
final pc = "PT0001";
final patient       = await api.get("/patients/$pc");
final prescriptions = await api.get("/prescriptions?patient_code=$pc");
final certificates  = await api.get("/certificates?patient_code=$pc");
final instructions  = await api.get("/instructions?patient_code=$pc");
final consents      = await api.get("/consents?patient_code=$pc");
final invoices      = await api.get("/invoices?patient_code=$pc");
final reminders     = await api.get("/reminders?patient_code=$pc");
final appointments  = await api.get("/appointments?patient_code=$pc");
```

**Action buttons:**
```
Prescribe    → POST /api/prescriptions    Doctor, Admin
Certificate  → POST /api/certificates    Doctor, Admin
Instructions → POST /api/instructions    Doctor, Admin
Consent      → POST /api/consents        Doctor, Admin
Invoice      → POST /api/invoices        Staff, Admin
Appointment  → POST /api/appointments    All
Set Reminder → POST /api/reminders       All
Records      → GET /api/records          All
```

---

# 🔑 ROLE-BASED VISIBILITY

```dart
final r = user.role;

// Patient actions
bool canPrescribe     = r == 'Doctor' || r == 'Admin';
bool canCertificate   = r == 'Doctor' || r == 'Admin';
bool canInstruction   = r == 'Doctor' || r == 'Admin';
bool canConsent       = r == 'Doctor' || r == 'Admin';
bool canInvoice       = r == 'Staff'  || r == 'Admin';
bool canBookAppt      = true;
bool canSetReminder   = true;
bool canEditPatient   = r == 'Staff'  || r == 'Admin';
bool canDeletePatient = r == 'Staff'  || r == 'Admin';

// Admin panel
bool showAdminPanel    = r == 'Admin';
bool canCreateUser     = r == 'Admin';
bool canApproveUsers   = r == 'Admin';
bool canDeleteUser     = r == 'Admin';
bool canChangeRole     = r == 'Admin';
bool canChangePassword = r == 'Admin';
bool canResetPdfLimit  = r == 'Admin';

// Form dropdowns
bool showDoctorDropdown  = r != 'Doctor'; // Doctor auto-selects self
bool showPatientDoctor   = r != 'Doctor'; // Staff/Admin pick doctor for patient
```

---

# ⚠️ GLOBAL ERRORS

```json
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
// Frontend: Interceptor → refresh token → if fails → Login

{ "status": false, "status_code": 401, "message": "Token expired or invalid", "data": null }
// Frontend: Interceptor → refresh token → if fails → Login

{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
// Frontend: Show toast. Don't redirect.

{ "status": false, "status_code": 500, "message": "Something went wrong", "data": null }
// Frontend: "Something went wrong. Please try again."
```

---

# 🎨 TOAST COLORS

| Code | Color | Action |
|------|-------|--------|
| 200 | 🟢 Green | Refresh data |
| 201 | 🟢 Green | Refresh + navigate |
| 400 | 🔴 Red | Show message |
| 401 | 🔴 Red | Interceptor handles |
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
| 7 | POST | /api/auth/refresh-token | Anyone |
| 8 | POST | /api/auth/logout | All |
| 9 | GET | /api/auth/doctors | All |
| | **PATIENT** | | |
| 10 | POST | /api/patients | All |
| 11 | GET | /api/patients | All |
| 12 | GET | /api/patients/:patient_code | All |
| 13 | PUT | /api/patients/:patient_code | Admin, Staff |
| 14 | DELETE | /api/patients/:patient_code | Admin, Staff |
| 15 | GET | /api/patients/search?q= | All |
| | **APPOINTMENT** | | |
| 16 | POST | /api/appointments | All |
| 17 | GET | /api/appointments | All |
| 18 | GET | /api/appointments/today | All |
| 19 | GET | /api/appointments/calendar?month= | All |
| 20 | GET | /api/appointments/:id | All |
| 21 | PUT | /api/appointments/:id | All |
| 22 | PATCH | /api/appointments/:id/status | All |
| 23 | DELETE | /api/appointments/:id | All |
| | **PRESCRIPTION** | | |
| 24 | POST | /api/prescriptions | Doctor, Admin |
| 25 | GET | /api/prescriptions | All |
| 26 | GET | /api/prescriptions/:id | All |
| 27 | PUT | /api/prescriptions/:id | Doctor(own), Admin |
| 28 | DELETE | /api/prescriptions/:id | Doctor(own), Admin |
| 29 | POST | /api/prescriptions/:id/medicines | Doctor(own), Admin |
| 30 | PUT | /api/prescriptions/:id/medicines/:mid | Doctor(own), Admin |
| 31 | DELETE | /api/prescriptions/:id/medicines/:mid | Doctor(own), Admin |
| 32 | POST | /api/prescriptions/:id/lab-tests | Doctor(own), Admin |
| 33 | PUT | /api/prescriptions/:id/lab-tests/:lid | Doctor(own), Admin |
| 34 | DELETE | /api/prescriptions/:id/lab-tests/:lid | Doctor(own), Admin |
| | **CERTIFICATE** | | |
| 35 | POST | /api/certificates | Doctor, Admin |
| 36 | GET | /api/certificates | All |
| 37 | GET | /api/certificates/:id | All |
| 38 | PUT | /api/certificates/:id | Doctor(own), Admin |
| 39 | DELETE | /api/certificates/:id | Doctor(own), Admin |
| | **INSTRUCTION** | | |
| 40 | POST | /api/instructions | Doctor, Admin |
| 41 | GET | /api/instructions | All |
| 42 | GET | /api/instructions/:id | All |
| 43 | PUT | /api/instructions/:id | Doctor(own), Admin |
| 44 | DELETE | /api/instructions/:id | Doctor(own), Admin |
| | **CONSENT** | | |
| 45 | POST | /api/consents | Doctor, Admin |
| 46 | GET | /api/consents | All |
| 47 | GET | /api/consents/:id | All |
| 48 | PUT | /api/consents/:id | Doctor(own), Admin |
| 49 | DELETE | /api/consents/:id | Doctor(own), Admin |
| | **TEMPLATE** | | |
| 50 | POST | /api/templates | Doctor, Admin |
| 51 | GET | /api/templates | Doctor, Admin |
| 52 | GET | /api/templates/:id | Doctor, Admin |
| 53 | GET | /api/templates/search?type=&q= | Doctor, Admin |
| 54 | PUT | /api/templates/:id | Doctor(own), Admin |
| 55 | DELETE | /api/templates/:id | Doctor(own), Admin |
| | **REMINDER** | | |
| 56 | POST | /api/reminders | All |
| 57 | GET | /api/reminders | All |
| 58 | PUT | /api/reminders/:id | All |
| 59 | DELETE | /api/reminders/:id | All |
| | **INVOICE** | | |
| 60 | POST | /api/invoices | Staff, Admin |
| 61 | GET | /api/invoices | Staff, Admin |
| 62 | GET | /api/invoices/:id | Staff, Admin |
| 63 | PUT | /api/invoices/:id | Staff, Admin |
| 64 | PATCH | /api/invoices/:id/status | Staff, Admin |
| 65 | DELETE | /api/invoices/:id | Staff, Admin |
| 66 | POST | /api/invoices/:id/items | Staff, Admin |
| 67 | DELETE | /api/invoices/:id/items/:itemId | Staff, Admin |
| | **RECORDS** | | |
| 68 | GET | /api/records?patient_code=&search= | All |
| | **ADMIN PANEL** | | |
| 69 | GET | /api/admin/dashboard | Admin |
| 70 | POST | /api/admin/create-user | Admin |
| 71 | GET | /api/admin/users | Admin |
| 72 | GET | /api/admin/users/:user_code | Admin |
| 73 | DELETE | /api/admin/users/:user_code | Admin |
| 74 | GET | /api/admin/pending | Admin |
| 75 | PATCH | /api/admin/approve/:user_code | Admin |
| 76 | PATCH | /api/admin/reject/:user_code | Admin |
| 77 | GET | /api/admin/patients | Admin |
| 78 | GET | /api/admin/patients/:patient_code | Admin |
| 79 | PATCH | /api/admin/change-password | Admin |
| 80 | PATCH | /api/admin/users/:user_code/role | Admin |
| 81 | PATCH | /api/admin/reset-limit/:user_code | Admin |

---

| Module | Count |
|--------|-------|
| Auth | 9 |
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
| Admin Panel | 13 |
| **TOTAL** | **81** |
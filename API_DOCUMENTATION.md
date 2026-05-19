# Medical App — Complete API Documentation v2

**Base URL:** `https://adixonclinicos.info/api`
**Total Endpoints:** 73 | **Total Tables:** 14

---

## Response Format (ALL endpoints)
```json
{
  "status": true,          // true = success, false = error
  "status_code": 200,      // HTTP status code
  "message": "...",        // Human readable message (show in toast)
  "data": { }              // null on errors, object/array on success
}
```

## Auth Header (required on all except #1-#5)
```
Authorization: Bearer <accessToken>
```

## Codes — NEVER internal IDs
```
Patient:  PT0001, PT0002, PT0003...
Doctor:   DR0001, DR0002...
Staff:    ST0001, ST0002...
```

---

# AUTH (10 Endpoints)

---

### #1 POST /api/auth/register
**Who:** Anyone (no token needed)
**When:** Register screen → user fills form → tap "Register"

**Request Body:**
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
| email | string | ✅ | Must be unique |
| phone | string | ❌ | |
| password | string | ✅ | |
| role | string | ✅ | `"Doctor"` or `"Staff"` only |
| platform | string | ❌ | `"web"` / `"android"` / `"ios"` / `"unknown"` |
| device_type | string | ❌ | `"mobile"` / `"tablet"` / `"desktop"` / `"unknown"` |

**✅ 201 Success:**
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

**❌ 400 Missing fields:**
```json
{ "status": false, "status_code": 400, "message": "All fields are required", "data": null }
```

**❌ 400 Invalid role:**
```json
{ "status": false, "status_code": 400, "message": "Role must be Doctor or Staff", "data": null }
```

**❌ 403 Admin role blocked:**
```json
{ "status": false, "status_code": 403, "message": "Admin registration is not allowed", "data": null }
```

**❌ 409 Duplicate email:**
```json
{ "status": false, "status_code": 409, "message": "Email already registered", "data": null }
```

**Frontend:** Show success → navigate to "Wait for admin approval" screen. Do NOT auto-login.

---

### #2 POST /api/auth/login
**Who:** Anyone (no token needed)
**When:** Login screen → tap "Login"

**Request Body:**
```json
{
  "email": "amit@doctor.com",
  "password": "Doctor@123",
  "platform": "android",
  "device_type": "mobile"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | ✅ | |
| password | string | ✅ | |
| platform | string | ❌ | |
| device_type | string | ❌ | |

**✅ 200 Success:**
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

**❌ 400 Missing fields:**
```json
{ "status": false, "status_code": 400, "message": "Email and password are required", "data": null }
```

**❌ 401 Wrong credentials:**
```json
{ "status": false, "status_code": 401, "message": "Invalid email or password", "data": null }
```

**❌ 403 Not verified:**
```json
{ "status": false, "status_code": 403, "message": "Your account is not verified yet. Please contact your admin.", "data": null }
```

**Frontend:**
- Save `accessToken` and `refreshToken` in secure storage
- Save `user` object for role checks
- `accessToken` expires in **7 days**, `refreshToken` in **30 days**
- Admin bypasses isVerified check (always can login)
- Navigate to Dashboard on success

---

### #3 POST /api/auth/forgot-password
**Who:** Anyone (no token needed)
**When:** Login screen → "Forgot Password?" → enter email → tap "Send OTP"

**Request Body:**
```json
{ "email": "amit@doctor.com" }
```

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "OTP sent to your email", "data": null }
```

**❌ 404 Email not found:**
```json
{ "status": false, "status_code": 404, "message": "No account found with this email", "data": null }
```

**Frontend:** Navigate to OTP input screen. OTP expires in **10 minutes**.

---

### #4 POST /api/auth/verify-otp
**Who:** Anyone (no token needed)
**When:** OTP screen → enter 6-digit OTP → tap "Verify"

**Request Body:**
```json
{ "email": "amit@doctor.com", "otp": "482917" }
```

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "OTP verified successfully", "data": null }
```

**❌ 400 Invalid/expired OTP:**
```json
{ "status": false, "status_code": 400, "message": "Invalid or expired OTP", "data": null }
```

**Frontend:** OTP is cleared from DB after verify. Navigate to "New Password" screen. Pass `email` to next screen.

---

### #5 POST /api/auth/reset-password
**Who:** Anyone (no token needed)
**When:** New Password screen → enter new password → tap "Reset"

**Request Body:**
```json
{ "email": "amit@doctor.com", "new_password": "NewPass@123" }
```

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Password reset successful", "data": null }
```

**❌ 400 Missing fields:**
```json
{ "status": false, "status_code": 400, "message": "Email and new password are required", "data": null }
```

**❌ 404 User not found:**
```json
{ "status": false, "status_code": 404, "message": "User not found", "data": null }
```

**Frontend:** No OTP needed here — already verified in #4. Navigate to Login screen.

---

### #6 GET /api/auth/me
**Who:** Any logged in user
**When:** App launch → check token → fetch profile | Profile screen

**Request:** No body. Token in header.

**✅ 200 Success:**
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

**❌ 401 Not authenticated:**
```json
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
```

**❌ 401 Token expired:**
```json
{ "status": false, "status_code": 401, "message": "Token expired or invalid", "data": null }
```

**❌ 404 User not found:**
```json
{ "status": false, "status_code": 404, "message": "User not found", "data": null }
```

**Frontend:** On 401 → clear stored tokens → navigate to Login screen.

---

### #7 POST /api/auth/logout
**Who:** Any logged in user
**When:** Settings → tap "Logout"

**Request:** No body. Token in header.

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Logged out successfully", "data": null }
```

**❌ 401 Not authenticated:**
```json
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
```

**Frontend:** Clear tokens + user data from storage → navigate to Login.

---

### #8 GET /api/auth/pending
**Who:** Admin only
**When:** Admin panel → "Pending Approvals" tab

**Request:** No body. Token in header.

**✅ 200 Success:**
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
      "created_at": "2026-05-19T08:00:00.000Z"
    },
    {
      "user_code": "ST0001",
      "first_name": "Rahul",
      "last_name": "Kumar",
      "email": "rahul@staff.com",
      "phone": "9988776655",
      "role": "Staff",
      "created_at": "2026-05-18T10:00:00.000Z"
    }
  ]
}
```

**✅ 200 No pending users:**
```json
{ "status": true, "status_code": 200, "message": "Pending users fetched", "data": [] }
```

**❌ 401 Not authenticated:**
```json
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
```

**❌ 403 Not admin:**
```json
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

**Frontend:** Show list with "Approve" ✅ and "Reject" ❌ buttons per user.

---

### #9 PATCH /api/auth/approve/:user_code
**Who:** Admin only
**When:** Pending list → tap "Approve" on a user

**URL Example:** `PATCH /api/auth/approve/DR0001`

**Request:** No body.

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "User approved successfully", "data": null }
```

**❌ 400 Already verified:**
```json
{ "status": false, "status_code": 400, "message": "User is already verified", "data": null }
```

**❌ 400 Cannot approve admin:**
```json
{ "status": false, "status_code": 400, "message": "Cannot approve admin", "data": null }
```

**❌ 403 Not admin:**
```json
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

**❌ 404 User not found:**
```json
{ "status": false, "status_code": 404, "message": "User not found", "data": null }
```

**Frontend:** Remove user from pending list. Show green toast.

---

### #10 PATCH /api/auth/reject/:user_code
**Who:** Admin only
**When:** Pending list → tap "Reject" on a user

**URL Example:** `PATCH /api/auth/reject/ST0001`

**Request:** No body.

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "User rejected and removed", "data": null }
```

**❌ 400 Cannot reject admin:**
```json
{ "status": false, "status_code": 400, "message": "Cannot reject admin", "data": null }
```

**❌ 403 Not admin:**
```json
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

**❌ 404 User not found:**
```json
{ "status": false, "status_code": 404, "message": "User not found", "data": null }
```

**Frontend:** Remove user from pending list. Show green toast.

---

# PATIENT (6 Endpoints)

---

### #11 POST /api/patients
**Who:** Admin, Doctor, Staff
**When:** Patient list → tap "+" → fill form → tap "Save"

**Request Body:**
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
| date_of_birth | string | ❌ | Format: `YYYY-MM-DD` |
| age | integer | ❌ | |
| gender | string | ❌ | `"Male"` / `"Female"` / `"Other"` |
| blood_group | string | ❌ | e.g. `"A+"`, `"B-"`, `"O+"` |
| street_address | string | ❌ | |
| city | string | ❌ | |
| state | string | ❌ | |
| zip_code | string | ❌ | |

**✅ 201 Success:**
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

**❌ 400 Missing fields:**
```json
{ "status": false, "status_code": 400, "message": "First name and last name are required", "data": null }
```

**❌ 401 Not authenticated:**
```json
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
```

**❌ 403 Access denied:**
```json
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```

**Frontend:** Navigate to patient profile using returned `patient_code`.

---

### #12 GET /api/patients
**Who:** Admin, Doctor, Staff
**When:** Patient list screen → on load

**Request:** No body, no query params.

**✅ 200 Success:**
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

**✅ 200 Empty:**
```json
{ "status": true, "status_code": 200, "message": "Patients fetched", "data": [] }
```

**❌ 401 / 403:** Same as above.

---

### #13 GET /api/patients/:patient_code
**Who:** Admin, Doctor, Staff
**When:** Patient list → tap on a patient → profile screen

**URL Example:** `GET /api/patients/PT0001`

**✅ 200 Success:**
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

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**❌ 401 / 403:** Same as above.

---

### #14 PUT /api/patients/:patient_code
**Who:** Admin, Staff (NOT Doctor)
**When:** Patient profile → tap "Edit" → update fields → tap "Save"

**URL Example:** `PUT /api/patients/PT0001`

**Request Body:** Same fields as #11 (all optional except first_name, last_name).

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Patient updated", "data": null }
```

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**❌ 401 / 403:** Same as above.

**Frontend:** Hide edit button if `user.role == 'Doctor'`.

---

### #15 DELETE /api/patients/:patient_code
**Who:** Admin, Staff (NOT Doctor)
**When:** Patient profile → tap "Delete" → confirm dialog → confirm

**URL Example:** `DELETE /api/patients/PT0001`

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Patient deleted", "data": null }
```

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**❌ 401 / 403:** Same as above.

**Frontend:** Soft delete. Navigate back to patient list. Remove from local list.

---

### #16 GET /api/patients/search?q=rajesh
**Who:** Admin, Doctor, Staff
**When:** Patient list → search bar → type query

**Query Params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| q | string | ✅ | Searches first_name, middle_name, last_name, phone, patient_code |

**✅ 200 Success:**
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

**✅ 200 No results:**
```json
{ "status": true, "status_code": 200, "message": "Search results", "data": [] }
```

**❌ 401 / 403:** Same as above.

**Frontend:** Debounce 300ms. Show results as user types. Max 20 results returned.

---

# APPOINTMENT (8 Endpoints)

---

### #17 POST /api/appointments
**Who:** Admin, Doctor, Staff
**When:** Appointment screen → tap "+" → fill form → tap "Save"
**Note:** Doctor is auto-assigned (single doctor system). No doctor dropdown.

**Way 1 — Existing Patient (has patient_code):**
```json
{
  "patient_code": "PT0001",
  "appointment_date": "2026-05-20",
  "appointment_time": "10:00",
  "purpose": "Fever",
  "notes": "Patient called in advance"
}
```

**Way 2 — Walk-in (no patient_code, fill manual fields):**
```json
{
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
| patient_code | string | ❌ | If provided = existing patient. If missing = walk-in |
| patient_name | string | ❌ | Required for walk-in only |
| patient_gender | string | ❌ | `"Male"` / `"Female"` / `"Other"` |
| patient_age | integer | ❌ | |
| patient_age_unit | string | ❌ | `"Year"` / `"Month"` (default: Year) |
| patient_dob | string | ❌ | `YYYY-MM-DD` |
| patient_whatsapp | string | ❌ | |
| patient_email | string | ❌ | |
| appointment_date | string | ✅ | `YYYY-MM-DD` |
| appointment_time | string | ✅ | `HH:MM` (24hr format) |
| purpose | string | ❌ | |
| notes | string | ❌ | |

**✅ 201 Success:**
```json
{ "status": true, "status_code": 201, "message": "Appointment created", "data": { "id": 1 } }
```

**❌ 400 Missing date/time:**
```json
{ "status": false, "status_code": 400, "message": "Appointment date and time are required", "data": null }
```

**❌ 400 Walk-in missing name:**
```json
{ "status": false, "status_code": 400, "message": "Patient name is required for walk-in", "data": null }
```

**❌ 404 Patient code invalid:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**❌ 401 / 403:** Same as above.

**Frontend:** Toggle between "Existing Patient" (searchable dropdown) and "Walk-in" (manual form).

---

### #18 GET /api/appointments
**Who:** Admin, Doctor, Staff
**When:** Appointment list screen → on load

**Query Params (all optional, combinable):**

| Param | Type | Values | Notes |
|-------|------|--------|-------|
| patient_code | string | `PT0001` | Filter by patient |
| filter | string | `today` / `history` / `upcoming` | Time filter |
| sort | string | `newest` / `oldest` | Default: newest |

**Examples:**
- `GET /api/appointments` — all
- `GET /api/appointments?filter=today` — today only
- `GET /api/appointments?filter=upcoming&sort=oldest` — upcoming, oldest first
- `GET /api/appointments?patient_code=PT0001` — specific patient

**✅ 200 Success:**
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
    },
    {
      "id": 2,
      "patient_name": "Unknown Walk-in",
      "patient_code": null,
      "patient_gender": "Female",
      "patient_age": 28,
      "patient_age_unit": "Year",
      "patient_whatsapp": "9977553311",
      "appointment_date": "2026-05-20",
      "appointment_time": "11:00:00",
      "purpose": "Headache",
      "status": "Confirmed",
      "doctor_name": "Amit Sharma",
      "doctor_code": "DR0001",
      "is_walkin": 1,
      "created_at": "2026-05-19T09:00:00.000Z"
    }
  ]
}
```

**Frontend:**
- `is_walkin: 1` → show "Walk-in" badge
- `patient_code: null` → no link to patient profile
- Doctor role sees only their own appointments

---

### #19 GET /api/appointments/today
**Who:** Admin, Doctor, Staff
**When:** Dashboard → "Today's Appointments" section

**✅ 200 Success:**
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

**✅ 200 No appointments today:**
```json
{ "status": true, "status_code": 200, "message": "Today's appointments fetched", "data": [] }
```

---

### #20 GET /api/appointments/calendar?month=2026-05
**Who:** Admin, Doctor, Staff
**When:** Appointment screen → calendar view → swipe month

**Query Params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| month | string | ✅ | Format: `YYYY-MM` |

**✅ 200 Success:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Calendar appointments fetched",
  "data": {
    "2026-05-19": [
      {
        "id": 1,
        "patient_name": "Rajesh Verma",
        "patient_code": "PT0001",
        "appointment_date": "2026-05-19",
        "appointment_time": "10:00:00",
        "status": "Confirmed"
      }
    ],
    "2026-05-20": [
      {
        "id": 2,
        "patient_name": "Walk-in Patient",
        "patient_code": null,
        "appointment_date": "2026-05-20",
        "appointment_time": "14:00:00",
        "status": "Pending"
      }
    ]
  }
}
```

**❌ 400 Missing month:**
```json
{ "status": false, "status_code": 400, "message": "Month parameter is required (YYYY-MM)", "data": null }
```

**Frontend:** Data is grouped by date string. Dates with no appointments won't appear in response. Show dot indicators on calendar dates that have entries.

---

### #21 GET /api/appointments/:id
**Who:** Admin, Doctor, Staff
**When:** Appointment list → tap on appointment → detail screen

**URL Example:** `GET /api/appointments/1`

**✅ 200 Success:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Appointment fetched",
  "data": {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
    "booked_by": 3,
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

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }
```

---

### #22 PUT /api/appointments/:id
**Who:** Admin, Doctor, Staff
**When:** Appointment detail → tap "Edit" → update → tap "Save"

**URL Example:** `PUT /api/appointments/1`

**Request Body:** Same fields as #17 (except patient_code — cannot change linked patient).

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Appointment updated", "data": null }
```

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }
```

---

### #23 PATCH /api/appointments/:id/status
**Who:** Admin, Doctor, Staff
**When:** Appointment card → tap status dropdown → select new status

**URL Example:** `PATCH /api/appointments/1/status`

**Request Body:**
```json
{ "status": "Confirmed" }
```

**Valid values:** `"Pending"` | `"Confirmed"` | `"Completed"` | `"Cancelled"`

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Status updated", "data": null }
```

**❌ 400 Invalid status:**
```json
{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }
```

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Appointment not found", "data": null }
```

---

### #24 DELETE /api/appointments/:id
**Who:** Admin, Doctor, Staff
**When:** Appointment detail → tap "Delete" → confirm

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Appointment deleted", "data": null }
```

---

# PRESCRIPTION (11 Endpoints) — PDF Limit on Create

---

### #25 POST /api/prescriptions
**Who:** Admin, Doctor
**When:** Patient profile → tap "Prescribe" → fill form → preview PDF → "Approve & Share" → THEN this API is called
**PDF Limit:** 300 total across prescriptions + certificates + instructions

**Request Body:**
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
  "treatment_advice": "Apply cream daily, avoid harsh sun",
  "end_note": "Review after 30 days",
  "follow_up_date": "2026-06-19",
  "notes": "Internal note for doctor",
  "prescription_date": "2026-05-19"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| patient_code | string | ✅ | |
| appointment_id | integer | ❌ | Link to appointment if exists |
| temperature | string | ❌ | All 9 vitals are optional strings |
| height | string | ❌ | |
| weight | string | ❌ | |
| pulse | string | ❌ | |
| blood_pressure | string | ❌ | |
| blood_sugar | string | ❌ | |
| hemoglobin | string | ❌ | |
| spo2 | string | ❌ | |
| respiration_rate | string | ❌ | |
| allergy | string | ❌ | 8 case history fields below |
| chief_complaint | string | ❌ | |
| history | string | ❌ | |
| findings | string | ❌ | |
| diagnosis | string | ❌ | |
| treatment_advice | string | ❌ | |
| end_note | string | ❌ | |
| follow_up_date | string | ❌ | `YYYY-MM-DD` |
| notes | string | ❌ | Internal, not shown on PDF |
| prescription_date | string | ❌ | `YYYY-MM-DD` |

**✅ 201 Success:**
```json
{ "status": true, "status_code": 201, "message": "Prescription created", "data": { "id": 1 } }
```

**❌ 400 Missing patient:**
```json
{ "status": false, "status_code": 400, "message": "Patient code is required", "data": null }
```

**❌ 404 Patient not found:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**❌ 429 PDF limit reached:**
```json
{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }
```

**❌ 401 / 403:** Same as above.

**Frontend Flow:** Fill form locally → add medicines/tests locally → generate PDF preview on device → user taps "Approve & Share" → THEN call POST /prescriptions → THEN POST medicines → THEN POST lab-tests. Flutter generates PDF using `pdf` + `printing` packages (free).

---

### #26 GET /api/prescriptions
**Who:** Admin, Doctor, Staff
**When:** Prescription list screen | Patient profile → Prescriptions tab

**Query Params:**

| Param | Type | Notes |
|-------|------|-------|
| patient_code | string | Filter by patient |
| sort | string | `"newest"` (default) / `"oldest"` |

**✅ 200 Success:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Prescriptions fetched",
  "data": [
    {
      "id": 1,
      "diagnosis": "Vitiligo",
      "chief_complaint": "Skin patches on arms",
      "prescription_date": "2026-05-19",
      "follow_up_date": "2026-06-19",
      "created_at": "2026-05-19T10:00:00.000Z",
      "doctor_name": "Amit Sharma",
      "doctor_code": "DR0001",
      "patient_name": "Rajesh Kumar Verma",
      "patient_code": "PT0001"
    }
  ]
}
```

---

### #27 GET /api/prescriptions/:id
**Who:** Admin, Doctor, Staff
**When:** Prescription list → tap on prescription → full detail (for PDF regeneration)

**URL Example:** `GET /api/prescriptions/1`

**✅ 200 Success:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Prescription fetched",
  "data": {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
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
    "prescription_date": "2026-05-19",
    "created_at": "2026-05-19T10:00:00.000Z",
    "updated_at": "2026-05-19T10:00:00.000Z",
    "doctor_name": "Amit Sharma",
    "doctor_code": "DR0001",
    "patient_name": "Rajesh Kumar Verma",
    "patient_code": "PT0001",
    "gender": "Male",
    "date_of_birth": "1990-05-15",
    "age": 35,
    "patient_phone": "9988776655",
    "street_address": "42 MG Road",
    "city": "Patna",
    "medicines": [
      {
        "id": 1,
        "name": "Charak Pigmento",
        "total_quantity": "1",
        "frequency": "Once a day",
        "route_form": "Topical",
        "no_of_days": "30",
        "instructions": "Apply morning",
        "additional_comments": "Sun exposure 15 mins"
      },
      {
        "id": 2,
        "name": "Tab Melanocyl 10mg",
        "total_quantity": "30",
        "frequency": "Twice a day",
        "route_form": "Oral",
        "no_of_days": "30",
        "instructions": "After food",
        "additional_comments": null
      }
    ],
    "lab_tests": [
      {
        "id": 1,
        "test_name": "CBC",
        "additional_comments": "Check for infection"
      }
    ]
  }
}
```

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Prescription not found", "data": null }
```

**Frontend:** Use this full data to regenerate PDF on device anytime.

---

### #28 PUT /api/prescriptions/:id
**Who:** Doctor (own only), Admin
**When:** Prescription detail → tap "Edit" → update → tap "Save"

**Request Body:** Same vitals + case history fields as #25 (without patient_code).

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Prescription updated", "data": null }
```

**❌ 403 Not owner:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

**❌ 404 Not found:**
```json
{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }
```

---

### #29 DELETE /api/prescriptions/:id
**Who:** Doctor (own only), Admin

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Prescription deleted", "data": null }
```

**❌ 403 / 404:** Same as #28.

---

### #30 POST /api/prescriptions/:id/medicines
**Who:** Doctor (own prescription only), Admin
**When:** After prescription created → add medicines one by one

**URL Example:** `POST /api/prescriptions/1/medicines`

**Request Body:**
```json
{
  "name": "Charak Pigmento",
  "total_quantity": "1",
  "frequency": "Once a day",
  "route_form": "Topical",
  "no_of_days": "30",
  "instructions": "Apply morning",
  "additional_comments": "Sun exposure 15 mins after application"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | Medicine name |
| total_quantity | string | ❌ | |
| frequency | string | ❌ | e.g. "Once a day", "Twice a day", "1-0-1" |
| route_form | string | ❌ | e.g. "Oral", "Topical", "IV", "IM" |
| no_of_days | string | ❌ | |
| instructions | string | ❌ | e.g. "Before food", "After food" |
| additional_comments | string | ❌ | |

**✅ 201 Success:**
```json
{ "status": true, "status_code": 201, "message": "Medicine added", "data": { "id": 1 } }
```

**❌ 400 Missing name:**
```json
{ "status": false, "status_code": 400, "message": "Medicine name is required", "data": null }
```

**❌ 403 Not owner:**
```json
{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }
```

---

### #31 PUT /api/prescriptions/:id/medicines/:medicineId
**Who:** Doctor (own), Admin
**URL Example:** `PUT /api/prescriptions/1/medicines/1`

**Request Body:** Same as #30.

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Medicine updated", "data": null }
```

**❌ 404 Medicine not found:**
```json
{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }
```

---

### #32 DELETE /api/prescriptions/:id/medicines/:medicineId
**Who:** Doctor (own), Admin
**URL Example:** `DELETE /api/prescriptions/1/medicines/1`

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Medicine deleted", "data": null }
```

**❌ 404:**
```json
{ "status": false, "status_code": 404, "message": "Medicine not found", "data": null }
```

---

### #33 POST /api/prescriptions/:id/lab-tests
**Who:** Doctor (own), Admin
**URL Example:** `POST /api/prescriptions/1/lab-tests`

**Request Body:**
```json
{ "test_name": "CBC", "additional_comments": "Check for infection markers" }
```

| Field | Type | Required |
|-------|------|----------|
| test_name | string | ✅ |
| additional_comments | string | ❌ |

**✅ 201 Success:**
```json
{ "status": true, "status_code": 201, "message": "Lab test added", "data": { "id": 1 } }
```

**❌ 400 Missing name:**
```json
{ "status": false, "status_code": 400, "message": "Test name is required", "data": null }
```

---

### #34 PUT /api/prescriptions/:id/lab-tests/:labTestId
**URL Example:** `PUT /api/prescriptions/1/lab-tests/1`

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Lab test updated", "data": null }
```

**❌ 404:**
```json
{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }
```

---

### #35 DELETE /api/prescriptions/:id/lab-tests/:labTestId
**URL Example:** `DELETE /api/prescriptions/1/lab-tests/1`

**✅ 200 Success:**
```json
{ "status": true, "status_code": 200, "message": "Lab test deleted", "data": null }
```

**❌ 404:**
```json
{ "status": false, "status_code": 404, "message": "Lab test not found", "data": null }
```

---

# CERTIFICATE (5 Endpoints) — PDF Limit on Create

---

### #36 POST /api/certificates
**Who:** Doctor, Admin
**PDF Limit:** Shares the 300 limit with prescriptions + instructions

**Request Body:**
```json
{
  "patient_code": "PT0001",
  "title": "Medical Certificate",
  "description": "This is to certify that Mr. Rajesh Verma was under my treatment from 15th May to 19th May 2026 for viral fever. He is advised rest for 3 more days.",
  "certificate_date": "2026-05-19"
}
```

| Field | Type | Required |
|-------|------|----------|
| patient_code | string | ✅ |
| title | string | ✅ |
| description | string | ✅ |
| certificate_date | string | ❌ |

**✅ 201 Success:**
```json
{ "status": true, "status_code": 201, "message": "Certificate created", "data": { "id": 1 } }
```

**❌ 400 Missing fields:**
```json
{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }
```

**❌ 404 Patient not found:**
```json
{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }
```

**❌ 429 PDF limit:**
```json
{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }
```

---

### #37 GET /api/certificates
**Query:** `?patient_code=PT0001` | `?sort=oldest`

**✅ 200 Success:**
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
      "created_at": "2026-05-19T10:00:00.000Z",
      "patient_name": "Rajesh Kumar Verma",
      "patient_code": "PT0001",
      "doctor_name": "Amit Sharma",
      "doctor_code": "DR0001"
    }
  ]
}
```

---

### #38 GET /api/certificates/:id
**URL Example:** `GET /api/certificates/1`

**✅ 200 Success:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Certificate fetched",
  "data": {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
    "title": "Medical Certificate",
    "description": "This is to certify...",
    "certificate_date": "2026-05-19",
    "created_at": "2026-05-19T10:00:00.000Z",
    "updated_at": "2026-05-19T10:00:00.000Z",
    "patient_name": "Rajesh Kumar Verma",
    "patient_code": "PT0001",
    "gender": "Male",
    "age": 35,
    "blood_group": "B+",
    "doctor_name": "Amit Sharma",
    "doctor_code": "DR0001"
  }
}
```

**❌ 404:**
```json
{ "status": false, "status_code": 404, "message": "Certificate not found", "data": null }
```

---

### #39 PUT /api/certificates/:id
**Who:** Doctor (own), Admin

**Request Body:** `{ "title": "...", "description": "...", "certificate_date": "..." }`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Certificate updated", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #40 DELETE /api/certificates/:id
**Who:** Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Certificate deleted", "data": null }`

**❌ 403 / 404:** Same as #39.

---

# INSTRUCTION (5 Endpoints) — PDF Limit on Create

---

### #41 POST /api/instructions
**Who:** Doctor, Admin | **PDF Limit:** Shares 300 limit

**Request Body:**
```json
{
  "patient_code": "PT0001",
  "title": "Epley Maneuver",
  "description": "Step 1: Sit on bed with legs extended...\nStep 2: Turn head 45 degrees...",
  "instruction_date": "2026-05-19"
}
```

| Field | Type | Required |
|-------|------|----------|
| patient_code | string | ✅ |
| title | string | ✅ |
| description | string | ✅ |
| instruction_date | string | ❌ |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Instruction created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**❌ 429:** `{ "status": false, "status_code": 429, "message": "PDF conversion limit reached. Please contact admin.", "data": null }`

---

### #42 GET /api/instructions
**Query:** `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Instructions fetched",
  "data": [{ "id": 1, "title": "Epley Maneuver", "description": "Step 1...", "instruction_date": "2026-05-19", "created_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "doctor_name": "Amit Sharma", "doctor_code": "DR0001" }]
}
```

---

### #43 GET /api/instructions/:id

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Instruction fetched",
  "data": { "id": 1, "patient_id": 1, "doctor_id": 2, "title": "Epley Maneuver", "description": "Step 1...", "instruction_date": "2026-05-19", "created_at": "...", "updated_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "gender": "Male", "age": 35, "doctor_name": "Amit Sharma", "doctor_code": "DR0001" }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Instruction not found", "data": null }`

---

### #44 PUT /api/instructions/:id
**Who:** Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Instruction updated", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #45 DELETE /api/instructions/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Instruction deleted", "data": null }`

**❌ 403 / 404:** Same as #44.

---

# CONSENT (5 Endpoints) — NO PDF Limit

---

### #46 POST /api/consents
**Who:** Doctor, Admin

**Request Body:**
```json
{
  "patient_code": "PT0001",
  "title": "Surgery Consent",
  "description": "I, Rajesh Verma, hereby consent to undergo the surgical procedure...",
  "consent_date": "2026-05-19"
}
```

| Field | Type | Required |
|-------|------|----------|
| patient_code | string | ✅ |
| title | string | ✅ |
| description | string | ✅ |
| consent_date | string | ❌ |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Consent created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code, title and description are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #47 GET /api/consents
**Query:** `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Consents fetched",
  "data": [{ "id": 1, "title": "Surgery Consent", "description": "I hereby consent...", "consent_date": "2026-05-19", "created_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "doctor_name": "Amit Sharma", "doctor_code": "DR0001" }]
}
```

---

### #48 GET /api/consents/:id

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Consent fetched",
  "data": { "id": 1, "patient_id": 1, "doctor_id": 2, "title": "Surgery Consent", "description": "I hereby consent...", "consent_date": "2026-05-19", "created_at": "...", "updated_at": "...", "patient_name": "Rajesh Kumar Verma", "patient_code": "PT0001", "gender": "Male", "age": 35, "doctor_name": "Amit Sharma", "doctor_code": "DR0001" }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Consent not found", "data": null }`

---

### #49 PUT /api/consents/:id
**Who:** Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Consent updated", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #50 DELETE /api/consents/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Consent deleted", "data": null }`

**❌ 403 / 404:** Same as #49.

---

# TEMPLATE (6 Endpoints)

---

### #51 POST /api/templates
**Who:** Doctor, Admin
**When:** Prescription screen → "Save as Template" | Templates tab → "+"

**Request Body (Medicine template):**
```json
{ "type": "Medicine", "title": "Vitiligo in 3 years child", "content": "{\"medicines\":[{\"name\":\"Charak Pigmento\",\"frequency\":\"Once a day\"}]}" }
```

**Request Body (Lab Test template):**
```json
{ "type": "Lab Test", "title": "Female infertility panel", "content": "{\"tests\":[{\"test_name\":\"FSH\"},{\"test_name\":\"LH\"}]}" }
```

**Request Body (Instruction template):**
```json
{ "type": "Instruction", "title": "Epley Maneuver", "content": "{\"description\":\"Step 1: Sit on bed...\"}" }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | ✅ | `"Medicine"` / `"Lab Test"` / `"Instruction"` |
| title | string | ✅ | |
| content | string | ✅ | JSON string — store template data |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Template created", "data": { "id": 1 } }`

**❌ 400 Missing fields:**
```json
{ "status": false, "status_code": 400, "message": "Type, title and content are required", "data": null }
```

**❌ 400 Invalid type:**
```json
{ "status": false, "status_code": 400, "message": "Type must be Medicine, Lab Test or Instruction", "data": null }
```

---

### #52 GET /api/templates
**Query:** `?type=Medicine` | `?type=Lab Test` | `?type=Instruction`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Templates fetched",
  "data": [
    { "id": 1, "type": "Medicine", "title": "Vitiligo in 3 years child", "content": "{\"medicines\":[...]}", "created_at": "...", "created_by_name": "Amit Sharma", "doctor_code": "DR0001" }
  ]
}
```

---

### #53 GET /api/templates/:id

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Template fetched",
  "data": { "id": 1, "created_by": 2, "type": "Medicine", "title": "Vitiligo in 3 years child", "content": "{\"medicines\":[...]}", "created_at": "...", "updated_at": "...", "created_by_name": "Amit Sharma", "doctor_code": "DR0001" }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Template not found", "data": null }`

---

### #54 GET /api/templates/search?type=Medicine&q=vitiligo
**When:** Prescription form → medicine field → type → search templates

| Param | Type | Required |
|-------|------|----------|
| q | string | ✅ |
| type | string | ❌ |

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Search results",
  "data": [{ "id": 1, "type": "Medicine", "title": "Vitiligo in 3 years child" }]
}
```

---

### #55 PUT /api/templates/:id
**Who:** Doctor (own), Admin

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Template updated", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "You can only modify your own data", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Resource not found", "data": null }`

---

### #56 DELETE /api/templates/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Template deleted", "data": null }`

**❌ 403 / 404:** Same as #55.

---

# REMINDER (4 Endpoints)

---

### #57 POST /api/reminders
**Who:** Admin, Doctor, Staff
**When:** Patient profile → tap "Set Reminder"

**Request Body (Regular Reminder):**
```json
{
  "patient_code": "PT0001",
  "reminder_type": "Reminder",
  "title": "Follow-up reminder",
  "description": "Take medications on time",
  "start_date": "2026-05-19",
  "end_date": "2026-05-26"
}
```

**Request Body (Payment Reminder):**
```json
{
  "patient_code": "PT0001",
  "reminder_type": "Payment Reminder",
  "title": "Payment due",
  "description": "₹1500 pending for consultation",
  "payment_link": "https://pay.example.com/123",
  "start_date": "2026-05-19",
  "end_date": "2026-05-24"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| patient_code | string | ✅ | |
| reminder_type | string | ❌ | `"Reminder"` (default) / `"Payment Reminder"` |
| title | string | ✅ | |
| description | string | ❌ | |
| payment_link | string | ❌ | Only for Payment Reminder |
| start_date | string | ❌ | `YYYY-MM-DD` |
| end_date | string | ❌ | `YYYY-MM-DD` |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Reminder created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code and title are required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

---

### #58 GET /api/reminders
**Query:** `?patient_code=PT0001` | `?reminder_type=Payment Reminder`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Reminders fetched",
  "data": [
    {
      "id": 1,
      "reminder_type": "Reminder",
      "title": "Follow-up reminder",
      "description": "Take medications on time",
      "payment_link": null,
      "start_date": "2026-05-19",
      "end_date": "2026-05-26",
      "is_done": 0,
      "created_at": "2026-05-19T10:00:00.000Z",
      "patient_name": "Rajesh Kumar Verma",
      "patient_code": "PT0001",
      "created_by_name": "Amit Sharma"
    }
  ]
}
```

**Frontend:** `is_done: 0` = pending, `is_done: 1` = completed. Show checkbox.

---

### #59 PUT /api/reminders/:id
**Who:** Admin, Doctor, Staff
**When:** Reminder card → tap to edit | tap checkbox to mark done

**Request Body (mark done):**
```json
{ "is_done": true }
```

**Request Body (full edit):**
```json
{ "title": "Updated title", "description": "Updated desc", "is_done": false }
```

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Reminder updated", "data": null }`

---

### #60 DELETE /api/reminders/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Reminder deleted", "data": null }`

---

# INVOICE (8 Endpoints)

---

### #61 POST /api/invoices
**Who:** Staff, Admin (NOT Doctor)
**When:** Patient profile → tap "Invoice" → fill 2-tab form → "Save"

**Request Body:**
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
  "remark": "Consultation + lab tests",
  "invoice_date": "2026-05-19",
  "status": "To pay"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| patient_code | string | ✅ | |
| bill_to_name | string | ❌ | Auto-fill from patient name |
| invoice_title | string | ❌ | Default: "Invoice" |
| currency | string | ❌ | Default: "INR" |
| discount_title | string | ❌ | Default: "Discount" |
| discount_value | number | ❌ | Default: 0 |
| discount_type | string | ❌ | `"Amount"` / `"Percentage"` (default: Amount) |
| advance_title | string | ❌ | Default: "Amount Paid" |
| advance_amount | number | ❌ | Default: 0 |
| tax_title | string | ❌ | Default: "GST" |
| tax_value | number | ❌ | Default: 0 |
| tax_type | string | ❌ | `"Amount"` / `"Percentage"` (default: Percentage) |
| remark | string | ❌ | |
| invoice_date | string | ❌ | `YYYY-MM-DD` |
| status | string | ❌ | `"To pay"` / `"Paid"` / `"None"` (default: To pay) |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Invoice created", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Patient code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**Frontend:** After creating invoice, add items using #67. Total auto-calculated.

---

### #62 GET /api/invoices
**Query:** `?patient_code=PT0001` | `?sort=oldest`

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Invoices fetched",
  "data": [
    {
      "id": 1,
      "invoice_title": "Invoice",
      "bill_to_name": "Rajesh Verma",
      "currency": "INR",
      "total_amount": "1170.00",
      "status": "To pay",
      "invoice_date": "2026-05-19",
      "created_at": "2026-05-19T10:00:00.000Z",
      "patient_name": "Rajesh Kumar Verma",
      "patient_code": "PT0001",
      "created_by_name": "Rahul Kumar"
    }
  ]
}
```

---

### #63 GET /api/invoices/:id
**Returns invoice + all items**

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Invoice fetched",
  "data": {
    "id": 1,
    "patient_id": 1,
    "created_by": 3,
    "bill_to_name": "Rajesh Verma",
    "invoice_title": "Invoice",
    "currency": "INR",
    "discount_title": "Discount",
    "discount_value": "100.00",
    "discount_type": "Amount",
    "advance_title": "Amount Paid",
    "advance_amount": "500.00",
    "tax_title": "GST",
    "tax_value": "18.00",
    "tax_type": "Percentage",
    "remark": "Consultation + lab tests",
    "invoice_date": "2026-05-19",
    "status": "To pay",
    "total_amount": "1170.00",
    "created_at": "2026-05-19T10:00:00.000Z",
    "updated_at": "2026-05-19T10:00:00.000Z",
    "patient_name": "Rajesh Kumar Verma",
    "patient_code": "PT0001",
    "created_by_name": "Rahul Kumar",
    "items": [
      { "id": 1, "description": "Consultation", "amount": "500.00" },
      { "id": 2, "description": "Lab Tests - CBC", "amount": "1000.00" }
    ]
  }
}
```

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Invoice not found", "data": null }`

**Frontend — Total Calculation:**
```
items_total = 500 + 1000 = 1500
tax = 1500 × 18% = 270
discount = 100 (flat)
advance = 500
total = 1500 + 270 - 100 - 500 = 1170
```

---

### #64 PUT /api/invoices/:id
**Auto-recalculates total based on current items + new discount/tax/advance values.**

**Request Body:** Same fields as #61 (except patient_code).

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Invoice updated", "data": null }`

---

### #65 PATCH /api/invoices/:id/status
**When:** Invoice detail → tap status button → change

**Request Body:**
```json
{ "status": "Paid" }
```

**Valid:** `"To pay"` | `"Paid"` | `"None"`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Invoice status updated", "data": null }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Invalid status", "data": null }`

---

### #66 DELETE /api/invoices/:id

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Invoice deleted", "data": null }`

---

### #67 POST /api/invoices/:id/items
**When:** Invoice form → "Add Item" → enter description + amount
**Auto-recalculates invoice total after adding.**

**URL Example:** `POST /api/invoices/1/items`

**Request Body:**
```json
{ "description": "Consultation Fee", "amount": 500 }
```

| Field | Type | Required |
|-------|------|----------|
| description | string | ✅ |
| amount | number | ✅ |

**✅ 201:** `{ "status": true, "status_code": 201, "message": "Item added", "data": { "id": 1 } }`

**❌ 400:** `{ "status": false, "status_code": 400, "message": "Description and amount are required", "data": null }`

---

### #68 DELETE /api/invoices/:id/items/:itemId
**Auto-recalculates invoice total after deleting.**

**URL Example:** `DELETE /api/invoices/1/items/2`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "Item deleted", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Item not found", "data": null }`

---

# RECORDS — Combined Patient View (1 Endpoint)

---

### #69 GET /api/records?patient_code=PT0001&search=fever
**Who:** Admin, Doctor, Staff
**When:** Patient profile → "Records" tab → shows all data across all modules

**Query Params:**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| patient_code | string | ✅ | |
| search | string | ❌ | Searches across all modules |

**Search fields per module:**
- Prescriptions: diagnosis, chief_complaint, findings, treatment_advice
- Certificates: title, description
- Instructions: title, description
- Consents: title, description
- Invoices: invoice_title, remark
- Appointments: purpose, patient_name
- Reminders: title, description

**✅ 200 Success:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Records fetched",
  "data": {
    "prescriptions": [
      { "id": 1, "diagnosis": "Vitiligo", "chief_complaint": "Skin patches", "prescription_date": "2026-05-19", "created_at": "...", "doctor_name": "Amit Sharma", "doctor_code": "DR0001" }
    ],
    "certificates": [
      { "id": 1, "title": "Medical Certificate", "description": "This is to certify...", "certificate_date": "2026-05-19", "created_at": "...", "doctor_name": "Amit Sharma" }
    ],
    "instructions": [
      { "id": 1, "title": "Epley Maneuver", "description": "Step 1...", "instruction_date": "2026-05-19", "created_at": "...", "doctor_name": "Amit Sharma" }
    ],
    "consents": [
      { "id": 1, "title": "Surgery Consent", "description": "I hereby consent...", "consent_date": "2026-05-19", "created_at": "...", "doctor_name": "Amit Sharma" }
    ],
    "invoices": [
      { "id": 1, "invoice_title": "Invoice", "total_amount": "1170.00", "status": "To pay", "invoice_date": "2026-05-19", "created_at": "..." }
    ],
    "appointments": [
      { "id": 1, "patient_name": "Rajesh Verma", "appointment_date": "2026-05-20", "appointment_time": "10:00:00", "purpose": "Fever", "status": "Confirmed", "doctor_name": "Amit Sharma" }
    ],
    "reminders": [
      { "id": 1, "reminder_type": "Reminder", "title": "Follow-up", "description": "Take meds", "start_date": "2026-05-19", "end_date": "2026-05-26", "is_done": 0, "created_at": "..." }
    ]
  }
}
```

**❌ 400:** `{ "status": false, "status_code": 400, "message": "patient_code is required", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "Patient not found", "data": null }`

**Frontend:** Show as tabs or sections. Each section shows count badge. Empty arrays = "No data" placeholder.

---

# ADMIN (3 Endpoints)

---

### #70 GET /api/admin/dashboard
**Who:** Admin only
**When:** Admin panel → Dashboard tab

**✅ 200:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "Admin dashboard",
  "data": {
    "users": {
      "total_doctors": 1,
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

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

---

### #71 GET /api/admin/users
**Who:** Admin only
**When:** Admin panel → Users tab

**✅ 200:**
```json
{
  "status": true, "status_code": 200, "message": "Users fetched",
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
      "isVerified": 1,
      "last_login_at": "2026-05-18T15:00:00.000Z",
      "created_at": "2026-05-02T09:00:00.000Z"
    }
  ]
}
```

**Frontend:** `isVerified: 1` = active, `isVerified: 0` = pending. `last_login_at: null` = never logged in.

---

### #72 PATCH /api/admin/reset-limit/:user_code
**Who:** Admin only
**When:** Admin panel → PDF Usage section → tap "Reset" on a user

**URL Example:** `PATCH /api/admin/reset-limit/DR0001`

**✅ 200:** `{ "status": true, "status_code": 200, "message": "PDF limit reset successfully", "data": null }`

**❌ 404:** `{ "status": false, "status_code": 404, "message": "User not found", "data": null }`

**❌ 403:** `{ "status": false, "status_code": 403, "message": "Access denied", "data": null }`

---

# DASHBOARD (1 Endpoint)

---

### #73 GET /api/dashboard
**Who:** Admin, Doctor, Staff (all roles)
**When:** Main dashboard screen → on load
**Note:** Doctor sees only their own data. Admin/Staff sees all.

**✅ 200:**
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
        "id": 1,
        "patient_name": "Rajesh Verma",
        "patient_code": "PT0001",
        "appointment_time": "10:00:00",
        "purpose": "Fever",
        "status": "Pending",
        "doctor_name": "Amit Sharma",
        "doctor_code": "DR0001"
      }
    ]
  }
}
```

---

# GLOBAL ERROR RESPONSES (apply to ALL endpoints)

### 401 — Not Authenticated
```json
{ "status": false, "status_code": 401, "message": "Not authenticated", "data": null }
```
**Trigger:** No `Authorization` header or missing `Bearer` prefix.
**Frontend:** Clear tokens → navigate to Login.

### 401 — Token Expired
```json
{ "status": false, "status_code": 401, "message": "Token expired or invalid", "data": null }
```
**Trigger:** JWT expired (after 7 days) or tampered.
**Frontend:** Clear tokens → navigate to Login.

### 403 — Access Denied
```json
{ "status": false, "status_code": 403, "message": "Access denied", "data": null }
```
**Trigger:** User role doesn't have permission for this endpoint.
**Frontend:** Show error toast. Don't redirect.

### 500 — Server Error
```json
{ "status": false, "status_code": 500, "message": "Something went wrong", "data": null }
```
**Trigger:** Unexpected server error.
**Frontend:** Show "Something went wrong. Please try again."

---

# PATIENT PROFILE — Loading All Tabs

```dart
final pc = "PT0001";

// Load all data for patient profile tabs
final patient       = await api.get("/patients/$pc");
final prescriptions = await api.get("/prescriptions?patient_code=$pc");
final certificates  = await api.get("/certificates?patient_code=$pc");
final instructions  = await api.get("/instructions?patient_code=$pc");
final consents      = await api.get("/consents?patient_code=$pc");
final invoices      = await api.get("/invoices?patient_code=$pc");
final reminders     = await api.get("/reminders?patient_code=$pc");
final appointments  = await api.get("/appointments?patient_code=$pc");
```

**Patient card action buttons:**
```
Prescribe    → POST /api/prescriptions    (Doctor, Admin)
Certificate  → POST /api/certificates     (Doctor, Admin)
Instructions → POST /api/instructions     (Doctor, Admin)
Consent      → POST /api/consents         (Doctor, Admin)
Invoice      → POST /api/invoices         (Staff, Admin)
Appointment  → POST /api/appointments     (All)
Set Reminder → POST /api/reminders        (All)
Records      → GET /api/records?patient_code=PT0001 (All)
```

---

# ROLE-BASED VISIBILITY

```dart
final r = user.role; // "Admin", "Doctor", "Staff"

// Button visibility
bool canPrescribe   = r == 'Doctor' || r == 'Admin';
bool canCertificate = r == 'Doctor' || r == 'Admin';
bool canInstruction = r == 'Doctor' || r == 'Admin';
bool canConsent     = r == 'Doctor' || r == 'Admin';
bool canInvoice     = r == 'Staff'  || r == 'Admin';
bool canBookAppt    = true; // All roles
bool canSetReminder = true; // All roles
bool canEditPatient = r == 'Staff'  || r == 'Admin';
bool canDeletePatient = r == 'Staff' || r == 'Admin';
bool canAdminPanel  = r == 'Admin';
bool canApproveUsers = r == 'Admin';
bool canResetPdfLimit = r == 'Admin';
```

---

# ERROR CODE QUICK REFERENCE

| Code | Message | Toast Color | Frontend Action |
|------|---------|------------|----------------|
| 200 | Success | 🟢 Green | Refresh data |
| 201 | Created | 🟢 Green | Refresh + navigate |
| 400 | Bad request | 🔴 Red | Show `message` from response |
| 401 | Not authenticated | 🔴 Red | Clear tokens → Login screen |
| 403 | Access denied | 🟠 Orange | Show `message` |
| 404 | Not found | 🔴 Red | Show `message` |
| 409 | Duplicate | 🟠 Orange | Show `message` |
| 429 | PDF limit | 🟠 Orange | Show "Contact admin" dialog |
| 500 | Server error | 🔴 Red | Show "Something went wrong" |

---

# ENDPOINT SUMMARY TABLE

| # | Method | URL | Who | PDF Limit |
|---|--------|-----|-----|-----------|
| 1 | POST | /api/auth/register | Anyone | ❌ |
| 2 | POST | /api/auth/login | Anyone | ❌ |
| 3 | POST | /api/auth/forgot-password | Anyone | ❌ |
| 4 | POST | /api/auth/verify-otp | Anyone | ❌ |
| 5 | POST | /api/auth/reset-password | Anyone | ❌ |
| 6 | GET | /api/auth/me | All | ❌ |
| 7 | POST | /api/auth/logout | All | ❌ |
| 8 | GET | /api/auth/pending | Admin | ❌ |
| 9 | PATCH | /api/auth/approve/:user_code | Admin | ❌ |
| 10 | PATCH | /api/auth/reject/:user_code | Admin | ❌ |
| 11 | POST | /api/patients | All | ❌ |
| 12 | GET | /api/patients | All | ❌ |
| 13 | GET | /api/patients/:patient_code | All | ❌ |
| 14 | PUT | /api/patients/:patient_code | Admin, Staff | ❌ |
| 15 | DELETE | /api/patients/:patient_code | Admin, Staff | ❌ |
| 16 | GET | /api/patients/search?q= | All | ❌ |
| 17 | POST | /api/appointments | All | ❌ |
| 18 | GET | /api/appointments | All | ❌ |
| 19 | GET | /api/appointments/today | All | ❌ |
| 20 | GET | /api/appointments/calendar?month= | All | ❌ |
| 21 | GET | /api/appointments/:id | All | ❌ |
| 22 | PUT | /api/appointments/:id | All | ❌ |
| 23 | PATCH | /api/appointments/:id/status | All | ❌ |
| 24 | DELETE | /api/appointments/:id | All | ❌ |
| 25 | POST | /api/prescriptions | Doctor, Admin | ✅ |
| 26 | GET | /api/prescriptions | All | ❌ |
| 27 | GET | /api/prescriptions/:id | All | ❌ |
| 28 | PUT | /api/prescriptions/:id | Doctor(own), Admin | ❌ |
| 29 | DELETE | /api/prescriptions/:id | Doctor(own), Admin | ❌ |
| 30 | POST | /api/prescriptions/:id/medicines | Doctor(own), Admin | ❌ |
| 31 | PUT | /api/prescriptions/:id/medicines/:medicineId | Doctor(own), Admin | ❌ |
| 32 | DELETE | /api/prescriptions/:id/medicines/:medicineId | Doctor(own), Admin | ❌ |
| 33 | POST | /api/prescriptions/:id/lab-tests | Doctor(own), Admin | ❌ |
| 34 | PUT | /api/prescriptions/:id/lab-tests/:labTestId | Doctor(own), Admin | ❌ |
| 35 | DELETE | /api/prescriptions/:id/lab-tests/:labTestId | Doctor(own), Admin | ❌ |
| 36 | POST | /api/certificates | Doctor, Admin | ✅ |
| 37 | GET | /api/certificates | All | ❌ |
| 38 | GET | /api/certificates/:id | All | ❌ |
| 39 | PUT | /api/certificates/:id | Doctor(own), Admin | ❌ |
| 40 | DELETE | /api/certificates/:id | Doctor(own), Admin | ❌ |
| 41 | POST | /api/instructions | Doctor, Admin | ✅ |
| 42 | GET | /api/instructions | All | ❌ |
| 43 | GET | /api/instructions/:id | All | ❌ |
| 44 | PUT | /api/instructions/:id | Doctor(own), Admin | ❌ |
| 45 | DELETE | /api/instructions/:id | Doctor(own), Admin | ❌ |
| 46 | POST | /api/consents | Doctor, Admin | ❌ |
| 47 | GET | /api/consents | All | ❌ |
| 48 | GET | /api/consents/:id | All | ❌ |
| 49 | PUT | /api/consents/:id | Doctor(own), Admin | ❌ |
| 50 | DELETE | /api/consents/:id | Doctor(own), Admin | ❌ |
| 51 | POST | /api/templates | Doctor, Admin | ❌ |
| 52 | GET | /api/templates | Doctor, Admin | ❌ |
| 53 | GET | /api/templates/:id | Doctor, Admin | ❌ |
| 54 | GET | /api/templates/search?type=&q= | Doctor, Admin | ❌ |
| 55 | PUT | /api/templates/:id | Doctor(own), Admin | ❌ |
| 56 | DELETE | /api/templates/:id | Doctor(own), Admin | ❌ |
| 57 | POST | /api/reminders | All | ❌ |
| 58 | GET | /api/reminders | All | ❌ |
| 59 | PUT | /api/reminders/:id | All | ❌ |
| 60 | DELETE | /api/reminders/:id | All | ❌ |
| 61 | POST | /api/invoices | Staff, Admin | ❌ |
| 62 | GET | /api/invoices | Staff, Admin | ❌ |
| 63 | GET | /api/invoices/:id | Staff, Admin | ❌ |
| 64 | PUT | /api/invoices/:id | Staff, Admin | ❌ |
| 65 | PATCH | /api/invoices/:id/status | Staff, Admin | ❌ |
| 66 | DELETE | /api/invoices/:id | Staff, Admin | ❌ |
| 67 | POST | /api/invoices/:id/items | Staff, Admin | ❌ |
| 68 | DELETE | /api/invoices/:id/items/:itemId | Staff, Admin | ❌ |
| 69 | GET | /api/records?patient_code=&search= | All | ❌ |
| 70 | GET | /api/admin/dashboard | Admin | ❌ |
| 71 | GET | /api/admin/users | Admin | ❌ |
| 72 | PATCH | /api/admin/reset-limit/:user_code | Admin | ❌ |
| 73 | GET | /api/dashboard | All | ❌ |

| Module | Count |
|--------|-------|
| Auth | 10 |
| Patient | 6 |
| Appointment | 8 |
| Prescription + Medicine + Lab Test | 11 |
| Certificate | 5 |
| Instruction | 5 |
| Consent | 5 |
| Template | 6 |
| Reminder | 4 |
| Invoice + Items | 8 |
| Records | 1 |
| Admin | 3 |
| Dashboard | 1 |
| **TOTAL** | **73** |

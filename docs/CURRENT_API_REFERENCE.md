 # BioStar Attendance API — Current API Reference

**Base URL**

```text
http://localhost:5001
```
### Final Url
```text
http://localhost:5001/dashboard
http://localhost:5001/dashboard/attendance-details
http://localhost:5001/dashboard/punch-history
http://localhost:5001/dashboard/events-log
```

**API Version**

```text
/api/v1
```

---

# API List

| # | Method | Endpoint                | Purpose                  |
| - | ------ | ----------------------- | ------------------------ |
| 1 | GET    | `/api/v1/daily/attendance`    | Daily attendance summary |
| 2 | GET    | `/api/v1/daily/punch-history` | Employee punch history   |
| 3 | GET    | `/api/v1/daily/events`        | BioStar event monitoring |

---

# 1. Attendance API

### Endpoint

```http
GET /api/v1/daily/attendance
```

### Full URL

```text
http://localhost:5001/api/v1/daily/attendance
```

### Query Parameters

| Parameter    | Required | Example      | Description     |
| ------------ | -------- | ------------ | --------------- |
| `date`       | Optional | `2026-09-02` | Attendance date |
| `employeeId` | Optional | `100016`     | Employee ID     |

### Examples

All employees for a date:

```http
GET http://localhost:5001/api/v1/daily/attendance?date=2026-09-02
```

Specific employee:

```http
GET http://localhost:5001/api/v1/daily/attendance?date=2026-09-02&employeeId=100016
```

### Purpose

Returns the daily attendance summary.

### Main Response Fields

```text
employeeId
employeeName
firstPunch
firstPunchReader
lastPunch
lastPunchReader
totalPunches
stayTime
status
```

### Business Logic

```text
Valid attendance event = Event ID 55
                         = Identify Success

Attendance readers = configured 8 readers only

If at least one valid punch exists:
    status = Present

First Punch:
    Earliest valid punch of the day

Last Punch:
    Latest valid punch of the day

Stay Time:
    Last Punch - First Punch

Single punch:
    Present
    Stay Time = 00:00:00

IMPORTANT:
Do NOT pair IN → OUT.
Do NOT use MIN(IN) / MAX(OUT).
First/Last are based purely on chronological punch time.
```

---

# 2. Punch History API

### Endpoint

```http
GET /api/v1/daily/punch-history
```

### Full URL

```text
http://localhost:5001/api/v1/daily/punch-history
```

### Query Parameters

| Parameter    | Required                               | Example      | Description |
| ------------ | -------------------------------------- | ------------ | ----------- |
| `employeeId` | Optional/Expected for employee history | `100016`     | Employee ID |
| `date`       | Optional/Expected                      | `2026-09-02` | Punch date  |

### Example

```http
GET http://localhost:5001/api/v1/daily/punch-history?employeeId=100016&date=2026-09-02
```

### Purpose

Returns all valid attendance punches for an employee on a selected date in chronological order.

### Response Fields

```text
punchId
employeeId
employeeName
dateTime
time
readerId
readerName
direction
eventId
```

### Example Result

```json
{
  "success": true,
  "data": {
    "employee": {
      "employeeId": "100016",
      "employeeName": "Md Anower Howlader"
    },
    "date": "2026-09-02",
    "totalPunches": 3,
    "punches": [
      {
        "punchId": 5190066,
        "employeeId": "100016",
        "employeeName": "Md Anower Howlader",
        "dateTime": "2026-09-02 06:59:28",
        "time": "06:59:28",
        "readerId": 539338120,
        "readerName": "T2-In[192.168.30.115]",
        "direction": "IN",
        "eventId": 55
      },
      {
        "punchId": 5190938,
        "employeeId": "100016",
        "employeeName": "Md Anower Howlader",
        "dateTime": "2026-09-02 13:04:32",
        "time": "13:04:32",
        "readerId": 539339534,
        "readerName": "T2-Out[192.168.30.110]",
        "direction": "OUT",
        "eventId": 55
      },
      {
        "punchId": 5190941,
        "employeeId": "100016",
        "employeeName": "Md Anower Howlader",
        "dateTime": "2026-09-02 13:04:39",
        "time": "13:04:39",
        "readerId": 539338120,
        "readerName": "T2-In[192.168.30.115]",
        "direction": "IN",
        "eventId": 55
      }
    ]
  }
}
```

---

# 3. Event Monitoring API

### Endpoint

```http
GET /api/v1/daily/events
```

### Full URL

```text
http://localhost:5001/api/v1/daily/events
```

### Query Parameters

| Parameter    | Required | Example      | Description            |
| ------------ | -------- | ------------ | ---------------------- |
| `employeeId` | Optional | `100016`     | Employee ID            |
| `date`       | Optional | `2026-09-02` | Event date             |
| `eventId`    | Optional | `55`         | Specific BioStar event |

### Examples

All events for an employee/date:

```http
GET http://localhost:5001/api/v1/daily/events?employeeId=100016&date=2026-09-02
```

Specific event:

```http
GET http://localhost:5001/api/v1/daily/events?employeeId=100016&date=2026-09-02&eventId=55
```

### Purpose

Returns BioStar events, not only attendance punches.

This API is intended for:

```text
Event Monitoring
Audit
Device Activity
Employee Activity
Security/Verification Events
Troubleshooting
```

### Response Fields

```text
eventLogId
employeeId
employeeName
dateTime
time
readerId
readerName
direction
eventId
eventName
eventDescription
```

### Example Result

```json
{
  "success": true,
  "data": {
    "total": 3,
    "events": [
      {
        "eventLogId": 5190066,
        "employeeId": "100016",
        "employeeName": "Md Anower Howlader",
        "dateTime": "2026-09-02 06:59:28",
        "time": "06:59:28",
        "readerId": 539338120,
        "readerName": "T2-In[192.168.30.115]",
        "direction": "IN",
        "eventId": 55,
        "eventName": "Identify Success",
        "eventDescription": ""
      },
      {
        "eventLogId": 5190938,
        "employeeId": "100016",
        "employeeName": "Md Anower Howlader",
        "dateTime": "2026-09-02 13:04:32",
        "time": "13:04:32",
        "readerId": 539339534,
        "readerName": "T2-Out[192.168.30.110]",
        "direction": "OUT",
        "eventId": 55,
        "eventName": "Identify Success",
        "eventDescription": ""
      }
    ]
  }
}
```

---

# Attendance Readers

Only these **8 readers** are considered attendance readers.

|   Reader ID | Reader Name             | Direction |
| ----------: | ----------------------- | --------- |
| `539338112` | T1-Out[192.168.30.109]  | OUT       |
| `539338120` | T2-In[192.168.30.115]   | IN        |
| `539339462` | Ad-In[192.168.30.103]   | IN        |
| `539339465` | HR-Out[192.168.30.105]  | OUT       |
| `539339470` | Ad-Out_[192.168.30.104] | OUT       |
| `539339471` | HR-In[192.168.30.106]   | IN        |
| `539339528` | T1-In[192.168.30.112]   | IN        |
| `539339534` | T2-Out[192.168.30.110]  | OUT       |

### Reader Direction Mapping

```text
IN
├── 539338120
├── 539339462
├── 539339471
└── 539339528

OUT
├── 539338112
├── 539339465
├── 539339470
└── 539339534
```

---

# Event Mapping

Important BioStar event IDs currently identified:

| Event ID | Event Name                      |
| -------: | ------------------------------- |
|      `7` | Request to Exit(Door)           |
|      `9` | Clear Alarm #1                  |
|     `10` | Reset(Sys Function)             |
|     `16` | Clear Alarm #2                  |
|     `17` | Clear Alarm #3                  |
|     `22` | Enroll Bad Finger               |
|     `23` | Enroll Success                  |
|     `24` | Enroll Fail                     |
|     `25` | Fingerprint Scan Fail           |
|     `32` | Card Enroll Success             |
|     `33` | Card Enroll Fail                |
|     `34` | System Started                  |
|     `36` | Verify Bad Face                 |
|     `38` | Verify Bad Finger               |
|     `39` | Verify Success                  |
|     `40` | Verify Fail                     |
|     `43` | Verify Success(ID and Finger)   |
|     `44` | Verify Success(ID and PIN)      |
|     `45` | Verify Success(Card and Finger) |
|     `46` | Verify Success(Card and PIN)    |
|     `55` | Identify Success                |
|     `71` | Delete Success                  |

---

# Database Tables Used

```text
TB_EVENT_LOG
        │
        ├── Attendance punches
        ├── BioStar events
        └── Event timestamps
              │
              ├── TB_USER
              │     └── Employee information
              │
              ├── TB_READER
              │     └── Reader/device information
              │
              └── TB_EVENT_DATA
                    └── Event name/description
```

### Employee Join

```sql
CAST(E.nUserID AS VARCHAR(64)) = U.sUserID
```

**Important:** Do not join:

```sql
E.nUserID = U.nUserIdn
```

---

# API Responsibility

```text
                    /api/v1
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
     attendance   punch-history   events
          │            │            │
          │            │            │
          ▼            ▼            ▼
      Summary       Punches       All Events
          │            │            │
          └────────────┴────────────┘
                       │
                       ▼
                BioStar SQL Server
```

### `/attendance`

Used for:

```text
Dashboard
Daily Attendance
Present/Absent
First Punch
Last Punch
Stay Time
Attendance Statistics
```

### `/punch-history`

Used for:

```text
Employee Details
Punch Timeline
Attendance Details Drawer
Punch Investigation
```

### `/events`

Used for:

```text
Event Monitoring
Audit
Device Events
Verification Events
Security Monitoring
Troubleshooting
```

---

# Current API Status

```text
Phase 1 — Attendance API       ✅ VALIDATED
Phase 2 — Punch History API    ✅ VALIDATED
Phase 3 — Event API            ✅ VALIDATED

Phase 4 — Dashboard V2         ⏳ NEXT
```

---

# Dashboard V2 API Flow

```text
Dashboard V2
     │
     ├── Attendance Page
     │       │
     │       └── GET /api/v1/daily/attendance
     │
     ├── Punch History
     │       │
     │       └── GET /api/v1/daily/punch-history
     │
     └── Event Monitoring
             │
             └── GET /api/v1/daily/events
```

---

# Important Development Rule

The existing dashboard and existing API must remain untouched.

```text
OLD DASHBOARD
     │
     └── DO NOT MODIFY


DASHBOARD V2
     │
     ├── New UI
     │
     └── Consumes existing /api/v1/daily/* APIs
```

**Current API count: 3**

```text
1. GET /api/v1/daily/attendance
2. GET /api/v1/daily/punch-history
3. GET /api/v1/daily/events
```

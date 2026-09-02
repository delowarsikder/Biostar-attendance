## initial Architecture we should build

                    BioStar SQL Server
                           │
                           │ READ ONLY
                           ▼
                    ┌───────────────┐
                    │  Next.js App  │
                    │               │
                    │ Server Side   │
                    │ SQL Queries   │
                    └───────┬───────┘
                            │
                            ▼
                     Attendance API
                            │
                            ▼
                    ┌───────────────┐
                    │   Dashboard   │
                    │               │
                    │ Daily         │
                    │ Monthly       │
                    │ Employee      │
                    └───────────────┘

             MySQL
                │
                └── Application configuration/settings
                    (later, if required)

## We can keep your Next.js application as a single monolithic application:
```text
biostar-attendance/
│
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── attendance/
│   └── ...
│
├── lib/
│   ├── biostar/
│   ├── database/
│   └── ...
│
├── prisma/
│
├── public/
│
└── ...

```

## Current Architecture

```text
BioStar SQL Server
192.168.30.100:1433
        │
        │ mssql
        ▼
Next.js Server
        │
        │ API
        ▼
Attendance Dashboard
        │
        ├── Date selector
        ├── Employee name
        ├── Employee ID
        ├── Department
        ├── In time
        ├── Out time
        ├── Status
        └── Work time

```

## our architecture becomes
```text

            
                       BioStar SQL Server
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
        TB_EVENT_LOG  
                |                           TB_TA_RESULT
                |                      Biostar Calculate attendance result
        Raw punch events                  TA calculation
                │                               │
       Punch histoy                             │
        ┌───────┴────────┐             ┌────────┴─────────┐
        │                │             │                  │
        ▼                ▼             ▼                  ▼
     First In         Last Out      Late/Early         Work Time
        │                │             │                  │
        └────────────┬───┘             └────────┬─────────┘
                     │                          │
                     └──────────┬───────────────┘
                                ▼
                         Our Attendance API
                                │
                                ▼
                         Attendance UI  

```

Inside biostar
```text
TB_TA_RESULT
    ↓
Authoritative attendance result
    ├── First In
    ├── Last Out
    ├── Work Time
    ├── Late
    ├── Early Out
    └── TA Result / Status

TB_EVENT_LOG
    ↓
Detailed punch history
    ├── Punch 1
    ├── Punch 2
    ├── Punch 3
    └── ...

```

## table Info
| Information               | Source                      |
| ------------------------- | --------------------------- |
| Employee                  | `TB_USER`                   |
| Department                | `TB_USER_DEPT`              |
| Raw punch history         | `TB_EVENT_LOG`              |
| First punch               | Derived from `TB_EVENT_LOG` |
| Last punch                | Derived from `TB_EVENT_LOG` |
| All punches               | `TB_EVENT_LOG`              |
| Shift                     | `TB_TA_SHIFT` / TA tables   |
| BioStar attendance result | `TB_TA_RESULT`              |
| Late minutes              | `TB_TA_RESULT`              |
| Early-out minutes         | `TB_TA_RESULT`              |
| BioStar work time         | `TB_TA_RESULT`              |


### architecture should now be:
```text
                    TB_EVENT_LOG
                         │
                         ↓
                   Raw Punches
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
          IN readers            OUT readers
              │                     │
       ┌──────┼──────┐        ┌─────┼─────┐
       ↓      ↓      ↓        ↓     ↓     ↓
     T1-In  Ad-In  HR-In    T1-Out Ad-Out HR-Out
       │                     │
       └──────────┬──────────┘
                  ↓
          Attendance Aggregator
                  │
        ┌─────────┼──────────┐
        ↓         ↓          ↓
     First In  Last Out   All Punches
        │         │          │
        └─────────┼──────────┘
                  ↓
             Attendance
```
```
|     Event | `nIsUseTA` | Interpretation for our API   |
| --------: | ---------: | ---------------------------- |
|    **55** |      **1** | Attendance/TA punch          |
|        23 |          0 | Other BioStar event          |
| Other IDs |     varies | Don't include until verified |

```

```
                  Employee
                     │
             All raw punches
                     │
              sort by time
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
    earliest punch         latest punch
          ↓                     ↓
       First In             Last Out


                       TB_EVENT_LOG
                     │
                     ▼
              Match TB_USER
                     │
                     ▼
           Match TB_USER_DEPT
                     │
                     ▼
             Convert timestamp
                     │
                     ▼
              Employee + Date
                     │
             ┌───────┴───────┐
             ▼               ▼
        MIN(punch)       MAX(punch)
             │               │
             ▼               ▼
          First In         Last Out

```

```text
Employee Master
      │
      ├── userId
      ├── name
      ├── department
      ├── shift
      └── active
             │
             ▼
      TB_EVENT_LOG
             │
             ├── IN punches
             └── OUT punches
             │
             ▼
      Daily Aggregation
             │
             ▼
      Attendance Report
```
## Final logic for log data

```text
                  TB_EVENT_LOG
                       │
                 Event = 55
                       │
                Attendance Readers
                       │
                       ▼
                 Daily punches
                       │
             ┌─────────┴─────────┐
             │                   │
        Monitoring           Attendance
             │                   │
       ALL punches          FIRST + LAST
             │                   │
       Timeline            Stay Duration
                                 │
                                 ▼
                         Analyze first/last
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
                IN→OUT        IN→IN/OUT→IN   OUT→IN
                  │              │              │
                Normal         Review         Abnormal

```

                  ┌───────────────┐
                  │ TB_EVENT_LOG  │
                  └───────┬───────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        TB_USER       TB_READER    TB_EVENT_DATA
             │            │            │
             └────────────┼────────────┘
                          ▼
                 Event Repository
                          │
                          ▼
                    Event Service
                          │
                          ▼
                   Event Controller
                          │
                          ▼
                /api/v1/events
                
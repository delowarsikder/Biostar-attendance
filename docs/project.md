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
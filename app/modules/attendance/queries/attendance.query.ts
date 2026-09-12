import {
    ATTENDANCE_READERS,
    BIOSTAR_IDENTIFY_SUCCESS_EVENT,
} from "../attendance.constants";

// IMPORTANT: Extract only the reader IDs (numeric) for the SQL IN clause.
// ATTENDANCE_READERS is an array of objects { id, name, ip, type }.
const readerList = ATTENDANCE_READERS.map(reader => reader.id).join(", ");

/**
 * ============================================================
 * COMMON ATTENDANCE QUERY
 * ============================================================
 *
 * Uses @date, @offset, @pageSize, and optional filters.
 *
 * The IsLate flag is now computed from the first punch time
 * (FirstPunch > '09:00:00') instead of relying on the BioStar
 * nLateInTime field (which is often 0 when no shifts are configured).
 *
 * You can change the cutoff time ('09:00:00') to match your
 * actual shift start time (e.g., '08:30:00').
 *
 * If your database stores times in UTC, you may need to convert
 * FirstPunch to local time before comparing, or adjust the cutoff
 * to UTC equivalent.
 */
export const ATTENDANCE_QUERY = `
WITH Employees AS
(
    SELECT
        U.nUserIdn AS UserIdn,
        U.sUserID AS EmployeeID,
        U.sUserName AS EmployeeName,
        U.nDepartmentIdn AS DepartmentID,
        D.sName AS DepartmentName

    FROM TB_USER U

    LEFT JOIN TB_USER_DEPT D
        ON D.nDepartmentIdn = U.nDepartmentIdn

    WHERE
        U.sUserID IS NOT NULL
),

DailyTA AS
(
    SELECT
        R.nUserIdn AS UserIdn,

        CAST(
            DATEADD(
                SECOND,
                R.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) AS AttendanceDate,

        R.nStartTime,
        R.nEndTime,
        R.nTAResult,
        R.nWorkTime,
        R.nLateInTime,
        R.nEarlyOutTime,
        R.nIsModify,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                R.nUserIdn,
                CAST(
                    DATEADD(
                        SECOND,
                        R.nDateTime,
                        '1970-01-01'
                    ) AS DATE
                )

            ORDER BY
                R.nDateTime DESC
        ) AS RN

    FROM TB_TA_RESULT R

    WHERE
        @date IS NULL

        OR CAST(
            DATEADD(
                SECOND,
                R.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) = @date
),

ValidPunches AS
(
    SELECT
        E.nEventLogIdn,
        E.nUserID,

        DATEADD(
            SECOND,
            E.nDateTime,
            '1970-01-01'
        ) AS EventDateTime,

        E.nReaderIdn,

        R.sName AS ReaderName,

        U.sUserID AS EmployeeID,
        U.sUserName AS EmployeeName

    FROM TB_EVENT_LOG E

    INNER JOIN TB_USER U
        ON CAST(
            E.nUserID AS VARCHAR(64)
        ) = U.sUserID

    LEFT JOIN TB_READER R
        ON E.nReaderIdn = R.nReaderIdn

    WHERE
        E.nEventIdn = ${BIOSTAR_IDENTIFY_SUCCESS_EVENT}

        AND E.nReaderIdn IN (${readerList})

        AND
        (
            @date IS NULL

            OR CAST(
                DATEADD(
                    SECOND,
                    E.nDateTime,
                    '1970-01-01'
                ) AS DATE
            ) = @date
        )
),

RankedPunches AS
(
    SELECT
        *,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                EmployeeID,
                CAST(EventDateTime AS DATE)

            ORDER BY
                EventDateTime ASC,
                nEventLogIdn ASC
        ) AS FirstPunchRank,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                EmployeeID,
                CAST(EventDateTime AS DATE)

            ORDER BY
                EventDateTime DESC,
                nEventLogIdn DESC
        ) AS LastPunchRank

    FROM ValidPunches
),

PunchSummary AS
(
    SELECT
        EmployeeID,

        CAST(
            EventDateTime AS DATE
        ) AS AttendanceDate,

        MIN(EventDateTime) AS FirstPunch,

        MAX(EventDateTime) AS LastPunch,

        COUNT(*) AS TotalPunches

    FROM ValidPunches

    GROUP BY
        EmployeeID,

        CAST(
            EventDateTime AS DATE
        )
),

PunchDetails AS
(
    SELECT
        P.EmployeeID,
        P.AttendanceDate,

        P.FirstPunch,
        FP.nReaderIdn AS FirstPunchReader,

        P.LastPunch, 
        LP.nReaderIdn AS LastPunchReader,

        P.TotalPunches,

        DATEDIFF(
            SECOND,
            P.FirstPunch,
            P.LastPunch
        ) AS StaySeconds

    FROM PunchSummary P

    LEFT JOIN RankedPunches FP
        ON FP.EmployeeID = P.EmployeeID

        AND CAST(
            FP.EventDateTime AS DATE
        ) = P.AttendanceDate

        AND FP.FirstPunchRank = 1

    LEFT JOIN RankedPunches LP
        ON LP.EmployeeID = P.EmployeeID

        AND CAST(
            LP.EventDateTime AS DATE
        ) = P.AttendanceDate

        AND LP.LastPunchRank = 1
),

FinalData AS
(
    SELECT
        E.EmployeeID,
        E.EmployeeName,

        E.DepartmentID,
        E.DepartmentName,

        @date AS AttendanceDate,

        P.FirstPunch,
        P.FirstPunchReader,

        P.LastPunch,
        P.LastPunchReader,

        ISNULL(
            P.TotalPunches,
            0
        ) AS TotalPunches,

        ISNULL(
            P.StaySeconds,
            0
        ) AS StaySeconds,

        T.nStartTime,
        T.nEndTime,
        T.nTAResult,
        T.nWorkTime,
        T.nLateInTime,
        T.nEarlyOutTime,
        T.nIsModify,

        -- ============================================================
        -- LATE COMPUTATION (from first punch time)
        -- ============================================================
        -- Change '09:00:00' to your actual shift start time.
        -- If your database uses UTC, adjust accordingly.
        CASE
            WHEN P.FirstPunch IS NOT NULL
                 AND CAST(P.FirstPunch AS TIME) > '09:00:00'
            THEN 1
            ELSE 0
        END AS IsLateComputed

    FROM Employees E

    LEFT JOIN DailyTA T
        ON T.UserIdn = E.UserIdn

        AND T.RN = 1

        AND
        (
            @date IS NULL
            OR T.AttendanceDate = @date
        )

    LEFT JOIN PunchDetails P
        ON P.EmployeeID = E.EmployeeID

        AND
        (
            @date IS NULL
            OR P.AttendanceDate = @date
        )

    LEFT JOIN TB_READER R_First
        ON R_First.nReaderIdn = P.FirstPunchReader

    LEFT JOIN TB_READER R_Last
        ON R_Last.nReaderIdn = P.LastPunchReader

    WHERE
        (
            @employeeId IS NULL
            OR E.EmployeeID = @employeeId
        )

        AND
        (
            @search IS NULL

            OR E.EmployeeID LIKE '%' + @search + '%'

            OR E.EmployeeName LIKE '%' + @search + '%'
        )

        AND
        (
            @departmentId IS NULL
            OR E.DepartmentID = @departmentId
        )

        AND
        (
            @departmentName IS NULL
            OR E.DepartmentName = @departmentName
        )

        AND
        (
            @readerId IS NULL
            OR P.FirstPunchReader = @readerId
            OR P.LastPunchReader = @readerId
        )

        AND
        (
            @reader IS NULL
            OR R_First.sName = @reader
            OR R_Last.sName = @reader
        )
)

SELECT
    EmployeeID,
    EmployeeName,

    DepartmentID,
    DepartmentName,

    CONVERT(
        VARCHAR(10),
        AttendanceDate,
        23
    ) AS AttendanceDate,

    CASE
        WHEN FirstPunch IS NOT NULL
        THEN CONVERT(
            VARCHAR(19),
            FirstPunch,
            120
        )
        ELSE NULL
    END AS FirstPunch,

    FirstPunchReader,

    CASE
        WHEN LastPunch IS NOT NULL
        THEN CONVERT(
            VARCHAR(19),
            LastPunch,
            120
        )
        ELSE NULL
    END AS LastPunch,

    LastPunchReader,

    TotalPunches,

    StaySeconds,

    CASE
        WHEN TotalPunches > 0
        THEN 1
        ELSE 0
    END AS HasAttendance,

    CASE
        WHEN TotalPunches > 0
        THEN 1
        ELSE 0
    END AS IsPresent,

    -- ============================================================
    -- Use computed late flag instead of nLateInTime
    -- ============================================================
    IsLateComputed AS IsLate,

    CASE
        WHEN ISNULL(nEarlyOutTime, 0) > 0
        THEN 1
        ELSE 0
    END AS IsEarlyOut,

    CASE
        WHEN TotalPunches > 0
        THEN 'Present'
        ELSE 'No Attendance'
    END AS AttendanceStatus,

    nStartTime,
    nEndTime,
    nTAResult,
    nWorkTime,
    nLateInTime,
    nEarlyOutTime,
    nIsModify

FROM FinalData

ORDER BY
    EmployeeName ASC

OFFSET @offset ROWS

FETCH NEXT @pageSize ROWS ONLY;
`;


/**
 * ============================================================
 * ATTENDANCE QUERY FOR EXPORT (NO PAGINATION)
 * ============================================================
 *
 * Same as ATTENDANCE_QUERY but without OFFSET/FETCH.
 * Returns ALL matching records for export.
 */
export const ATTENDANCE_EXPORT_QUERY = `
WITH Employees AS
(
    SELECT
        U.nUserIdn AS UserIdn,
        U.sUserID AS EmployeeID,
        U.sUserName AS EmployeeName,
        U.nDepartmentIdn AS DepartmentID,
        D.sName AS DepartmentName

    FROM TB_USER U

    LEFT JOIN TB_USER_DEPT D
        ON D.nDepartmentIdn = U.nDepartmentIdn

    WHERE
        U.sUserID IS NOT NULL
),

DailyTA AS
(
    SELECT
        R.nUserIdn AS UserIdn,

        CAST(
            DATEADD(
                SECOND,
                R.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) AS AttendanceDate,

        R.nStartTime,
        R.nEndTime,
        R.nTAResult,
        R.nWorkTime,
        R.nLateInTime,
        R.nEarlyOutTime,
        R.nIsModify,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                R.nUserIdn,
                CAST(
                    DATEADD(
                        SECOND,
                        R.nDateTime,
                        '1970-01-01'
                    ) AS DATE
                )

            ORDER BY
                R.nDateTime DESC
        ) AS RN

    FROM TB_TA_RESULT R

    WHERE
        @date IS NULL

        OR CAST(
            DATEADD(
                SECOND,
                R.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) = @date
),

ValidPunches AS
(
    SELECT
        E.nEventLogIdn,
        E.nUserID,

        DATEADD(
            SECOND,
            E.nDateTime,
            '1970-01-01'
        ) AS EventDateTime,

        E.nReaderIdn,

        R.sName AS ReaderName,

        U.sUserID AS EmployeeID,
        U.sUserName AS EmployeeName

    FROM TB_EVENT_LOG E

    INNER JOIN TB_USER U
        ON CAST(
            E.nUserID AS VARCHAR(64)
        ) = U.sUserID

    LEFT JOIN TB_READER R
        ON E.nReaderIdn = R.nReaderIdn

    WHERE
        E.nEventIdn = ${BIOSTAR_IDENTIFY_SUCCESS_EVENT}

        AND E.nReaderIdn IN (${readerList})

        AND
        (
            @date IS NULL

            OR CAST(
                DATEADD(
                    SECOND,
                    E.nDateTime,
                    '1970-01-01'
                ) AS DATE
            ) = @date
        )
),

RankedPunches AS
(
    SELECT
        *,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                EmployeeID,
                CAST(EventDateTime AS DATE)

            ORDER BY
                EventDateTime ASC,
                nEventLogIdn ASC
        ) AS FirstPunchRank,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                EmployeeID,
                CAST(EventDateTime AS DATE)

            ORDER BY
                EventDateTime DESC,
                nEventLogIdn DESC
        ) AS LastPunchRank

    FROM ValidPunches
),

PunchSummary AS
(
    SELECT
        EmployeeID,

        CAST(
            EventDateTime AS DATE
        ) AS AttendanceDate,

        MIN(EventDateTime) AS FirstPunch,

        MAX(EventDateTime) AS LastPunch,

        COUNT(*) AS TotalPunches

    FROM ValidPunches

    GROUP BY
        EmployeeID,

        CAST(
            EventDateTime AS DATE
        )
),

PunchDetails AS
(
    SELECT
        P.EmployeeID,
        P.AttendanceDate,

        P.FirstPunch,
        FP.nReaderIdn AS FirstPunchReader,

        P.LastPunch,
        LP.nReaderIdn AS LastPunchReader,

        P.TotalPunches,

        DATEDIFF(
            SECOND,
            P.FirstPunch,
            P.LastPunch
        ) AS StaySeconds

    FROM PunchSummary P

    LEFT JOIN RankedPunches FP
        ON FP.EmployeeID = P.EmployeeID

        AND CAST(
            FP.EventDateTime AS DATE
        ) = P.AttendanceDate

        AND FP.FirstPunchRank = 1

    LEFT JOIN RankedPunches LP
        ON LP.EmployeeID = P.EmployeeID

        AND CAST(
            LP.EventDateTime AS DATE
        ) = P.AttendanceDate

        AND LP.LastPunchRank = 1
),

FinalData AS
(
    SELECT
        E.EmployeeID,
        E.EmployeeName,

        E.DepartmentID,
        E.DepartmentName,

        @date AS AttendanceDate,

        P.FirstPunch,
        P.FirstPunchReader,

        P.LastPunch,
        P.LastPunchReader,

        ISNULL(
            P.TotalPunches,
            0
        ) AS TotalPunches,

        ISNULL(
            P.StaySeconds,
            0
        ) AS StaySeconds,

        T.nStartTime,
        T.nEndTime,
        T.nTAResult,
        T.nWorkTime,
        T.nLateInTime,
        T.nEarlyOutTime,
        T.nIsModify,

        -- ============================================================
        -- LATE COMPUTATION (from first punch time)
        -- ============================================================
        CASE
            WHEN P.FirstPunch IS NOT NULL
                 AND CAST(P.FirstPunch AS TIME) > '09:00:00'
            THEN 1
            ELSE 0
        END AS IsLateComputed

    FROM Employees E

    LEFT JOIN DailyTA T
        ON T.UserIdn = E.UserIdn

        AND T.RN = 1

        AND
        (
            @date IS NULL
            OR T.AttendanceDate = @date
        )

    LEFT JOIN PunchDetails P
        ON P.EmployeeID = E.EmployeeID

        AND
        (
            @date IS NULL
            OR P.AttendanceDate = @date
        )

    LEFT JOIN TB_READER R_First
        ON R_First.nReaderIdn = P.FirstPunchReader

    LEFT JOIN TB_READER R_Last
        ON R_Last.nReaderIdn = P.LastPunchReader

    WHERE
        (
            @employeeId IS NULL
            OR E.EmployeeID = @employeeId
        )

        AND
        (
            @search IS NULL

            OR E.EmployeeID LIKE '%' + @search + '%'

            OR E.EmployeeName LIKE '%' + @search + '%'
        )

        AND
        (
            @departmentId IS NULL
            OR E.DepartmentID = @departmentId
        )

        AND
        (
            @departmentName IS NULL
            OR E.DepartmentName = @departmentName
        )

        AND
        (
            @readerId IS NULL
            OR P.FirstPunchReader = @readerId
            OR P.LastPunchReader = @readerId
        )

        AND
        (
            @reader IS NULL
            OR R_First.sName = @reader
            OR R_Last.sName = @reader
        )
)

SELECT
    EmployeeID,
    EmployeeName,

    DepartmentID,
    DepartmentName,

    CONVERT(
        VARCHAR(10),
        AttendanceDate,
        23
    ) AS AttendanceDate,

    CASE
        WHEN FirstPunch IS NOT NULL
        THEN CONVERT(
            VARCHAR(19),
            FirstPunch,
            120
        )
        ELSE NULL
    END AS FirstPunch,

    FirstPunchReader,

    CASE
        WHEN LastPunch IS NOT NULL
        THEN CONVERT(
            VARCHAR(19),
            LastPunch,
            120
        )
        ELSE NULL
    END AS LastPunch,

    LastPunchReader,

    TotalPunches,

    StaySeconds,

    CASE
        WHEN TotalPunches > 0
        THEN 1
        ELSE 0
    END AS HasAttendance,

    CASE
        WHEN TotalPunches > 0
        THEN 1
        ELSE 0
    END AS IsPresent,

    -- ============================================================
    -- Use computed late flag instead of nLateInTime
    -- ============================================================
    IsLateComputed AS IsLate,

    CASE
        WHEN ISNULL(nEarlyOutTime, 0) > 0
        THEN 1
        ELSE 0
    END AS IsEarlyOut,

    CASE
        WHEN TotalPunches > 0
        THEN 'Present'
        ELSE 'No Attendance'
    END AS AttendanceStatus,

    nStartTime,
    nEndTime,
    nTAResult,
    nWorkTime,
    nLateInTime,
    nEarlyOutTime,
    nIsModify

FROM FinalData

ORDER BY
    EmployeeName ASC;
`;


/**
 * ============================================================
 * TOTAL EMPLOYEE COUNT
 * ============================================================
 *
 * This is NOT affected by pagination.
 */
export const ATTENDANCE_COUNT_QUERY = `
SELECT
    COUNT(*) AS Total

FROM TB_USER U

WHERE
    U.sUserID IS NOT NULL

    AND
    (
        @employeeId IS NULL
        OR U.sUserID = @employeeId
    )

    AND
    (
        @search IS NULL

        OR U.sUserID LIKE '%' + @search + '%'

        OR U.sUserName LIKE '%' + @search + '%'
    )

    AND
    (
        @departmentId IS NULL
        OR U.nDepartmentIdn = @departmentId
    );
`;


/**
 * ============================================================
 * FULL ATTENDANCE SUMMARY
 * ============================================================
 *
 * IMPORTANT:
 *
 * There is NO OFFSET/FETCH here.
 *
 * Therefore the cards calculate values from ALL
 * employees matching the current filters.
 */
export const ATTENDANCE_SUMMARY_QUERY = `
WITH Employees AS
(
    SELECT
        U.nUserIdn AS UserIdn,
        U.sUserID AS EmployeeID,
        U.sUserName AS EmployeeName,
        U.nDepartmentIdn AS DepartmentID

    FROM TB_USER U

    WHERE
        U.sUserID IS NOT NULL
),

DailyTA AS
(
    SELECT
        R.nUserIdn AS UserIdn,

        CAST(
            DATEADD(
                SECOND,
                R.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) AS AttendanceDate,

        R.nLateInTime,
        R.nEarlyOutTime,

        ROW_NUMBER() OVER
        (
            PARTITION BY
                R.nUserIdn,

                CAST(
                    DATEADD(
                        SECOND,
                        R.nDateTime,
                        '1970-01-01'
                    ) AS DATE
                )

            ORDER BY
                R.nDateTime DESC
        ) AS RN

    FROM TB_TA_RESULT R

    WHERE
        @date IS NULL

        OR CAST(
            DATEADD(
                SECOND,
                R.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) = @date
),

Punches AS
(
    SELECT
        U.sUserID AS EmployeeID,

        CAST(
            DATEADD(
                SECOND,
                E.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) AS AttendanceDate,

        COUNT(*) AS TotalPunches,

        -- ============================================================
        -- Needed for late computation: get the earliest punch time
        -- ============================================================
        MIN(DATEADD(
            SECOND,
            E.nDateTime,
            '1970-01-01'
        )) AS FirstPunch

    FROM TB_EVENT_LOG E

    INNER JOIN TB_USER U
        ON CAST(
            E.nUserID AS VARCHAR(64)
        ) = U.sUserID

    WHERE
        E.nEventIdn = ${BIOSTAR_IDENTIFY_SUCCESS_EVENT}

        AND E.nReaderIdn IN (${readerList})

        AND
        (
            @date IS NULL

            OR CAST(
                DATEADD(
                    SECOND,
                    E.nDateTime,
                    '1970-01-01'
                ) AS DATE
            ) = @date
        )

    GROUP BY
        U.sUserID,

        CAST(
            DATEADD(
                SECOND,
                E.nDateTime,
                '1970-01-01'
            ) AS DATE
        )
),

FinalSummary AS
(
    SELECT
        E.EmployeeID,

        CASE
            WHEN ISNULL(
                P.TotalPunches,
                0
            ) > 0

            THEN 1
            ELSE 0
        END AS HasAttendance,

        CASE
            WHEN ISNULL(
                P.TotalPunches,
                0
            ) > 0

            THEN 1
            ELSE 0
        END AS IsPresent,

        -- ============================================================
        -- LATE COMPUTATION (from first punch time)
        -- ============================================================
        CASE
            WHEN P.FirstPunch IS NOT NULL
                 AND CAST(P.FirstPunch AS TIME) > '09:00:00'
            THEN 1
            ELSE 0
        END AS IsLate,

        CASE
            WHEN ISNULL(
                T.nEarlyOutTime,
                0
            ) > 0

            THEN 1
            ELSE 0
        END AS IsEarlyOut

    FROM Employees E

    LEFT JOIN Punches P
        ON P.EmployeeID = E.EmployeeID

        AND
        (
            @date IS NULL
            OR P.AttendanceDate = @date
        )

    LEFT JOIN DailyTA T
        ON T.UserIdn = E.UserIdn

        AND T.RN = 1

        AND
        (
            @date IS NULL
            OR T.AttendanceDate = @date
        )

    WHERE
        (
            @employeeId IS NULL

            OR E.EmployeeID = @employeeId
        )

        AND
        (
            @search IS NULL

            OR E.EmployeeID LIKE '%' + @search + '%'

            OR E.EmployeeName LIKE '%' + @search + '%'
        )

        AND
        (
            @departmentId IS NULL

            OR E.DepartmentID = @departmentId
        )
)

SELECT
    COUNT(*) AS TotalEmployees,

    COALESCE(
        SUM(
            CASE
                WHEN IsPresent = 1
                THEN 1
                ELSE 0
            END
        ),
        0
    ) AS Present,

    COALESCE(
        SUM(
            CASE
                WHEN HasAttendance = 0
                THEN 1
                ELSE 0
            END
        ),
        0
    ) AS NoAttendance,

    COALESCE(
        SUM(
            CASE
                WHEN IsLate = 1
                THEN 1
                ELSE 0
            END
        ),
        0
    ) AS Late,

    COALESCE(
        SUM(
            CASE
                WHEN IsEarlyOut = 1
                THEN 1
                ELSE 0
            END
        ),
        0
    ) AS EarlyOut

FROM FinalSummary;
`;
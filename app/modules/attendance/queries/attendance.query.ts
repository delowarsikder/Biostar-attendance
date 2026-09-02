import {
  ATTENDANCE_READERS,
  BIOSTAR_IDENTIFY_SUCCESS_EVENT,
} from "../attendance.constants";

const readerList = ATTENDANCE_READERS.join(", ");

export const ATTENDANCE_QUERY = `
WITH Punches AS
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
        ON CAST(E.nUserID AS VARCHAR(64)) = U.sUserID

    LEFT JOIN TB_READER R
        ON E.nReaderIdn = R.nReaderIdn

    WHERE E.nEventIdn = ${BIOSTAR_IDENTIFY_SUCCESS_EVENT}

      AND E.nReaderIdn IN (${readerList})

      AND (@date IS NULL OR
           CAST(
               DATEADD(
                   SECOND,
                   E.nDateTime,
                   '1970-01-01'
               ) AS DATE
           ) = @date)

      AND (@employeeId IS NULL OR U.sUserID = @employeeId)

      AND (
          @search IS NULL
          OR U.sUserID LIKE '%' + @search + '%'
          OR U.sUserName LIKE '%' + @search + '%'
      )
),

RankedPunches AS
(
    SELECT
        *,

        ROW_NUMBER() OVER
        (
            PARTITION BY EmployeeID, CAST(EventDateTime AS DATE)
            ORDER BY EventDateTime ASC, nEventLogIdn ASC
        ) AS FirstPunchRank,

        ROW_NUMBER() OVER
        (
            PARTITION BY EmployeeID, CAST(EventDateTime AS DATE)
            ORDER BY EventDateTime DESC, nEventLogIdn DESC
        ) AS LastPunchRank

    FROM Punches
),

DailyAttendance AS
(
    SELECT
        EmployeeID,
        EmployeeName,

        CAST(EventDateTime AS DATE) AS AttendanceDate,

        MIN(EventDateTime) AS FirstPunch,

        MAX(EventDateTime) AS LastPunch,

        COUNT(*) AS TotalPunches

    FROM Punches

    GROUP BY
        EmployeeID,
        EmployeeName,
        CAST(EventDateTime AS DATE)
),

Result AS
(
    SELECT
        A.EmployeeID,
        A.EmployeeName,
        A.AttendanceDate,

        A.FirstPunch,
        FP.ReaderName AS FirstPunchReader,

        A.LastPunch,
        LP.ReaderName AS LastPunchReader,

        A.TotalPunches,

        DATEDIFF(
            SECOND,
            A.FirstPunch,
            A.LastPunch
        ) AS StaySeconds

    FROM DailyAttendance A

    LEFT JOIN RankedPunches FP
        ON FP.EmployeeID = A.EmployeeID
        AND CAST(FP.EventDateTime AS DATE) = A.AttendanceDate
        AND FP.FirstPunchRank = 1

    LEFT JOIN RankedPunches LP
        ON LP.EmployeeID = A.EmployeeID
        AND CAST(LP.EventDateTime AS DATE) = A.AttendanceDate
        AND LP.LastPunchRank = 1
)

SELECT
    EmployeeID,
    EmployeeName,
    CONVERT(VARCHAR(10), AttendanceDate, 23) AS AttendanceDate,

    CONVERT(VARCHAR(19), FirstPunch, 120) AS FirstPunch,

    FirstPunchReader,

    CONVERT(VARCHAR(19), LastPunch, 120) AS LastPunch,

    LastPunchReader,

    TotalPunches,

    StaySeconds,

    'Present' AS AttendanceStatus

FROM Result

ORDER BY
    AttendanceDate DESC,
    EmployeeID ASC

OFFSET @offset ROWS
FETCH NEXT @pageSize ROWS ONLY;
`;

export const ATTENDANCE_COUNT_QUERY = `
SELECT COUNT(*) AS Total

FROM
(
    SELECT
        U.sUserID,
        CAST(
            DATEADD(
                SECOND,
                E.nDateTime,
                '1970-01-01'
            ) AS DATE
        ) AS AttendanceDate

    FROM TB_EVENT_LOG E

    INNER JOIN TB_USER U
        ON CAST(E.nUserID AS VARCHAR(64)) = U.sUserID

    WHERE E.nEventIdn = ${BIOSTAR_IDENTIFY_SUCCESS_EVENT}

      AND E.nReaderIdn IN (${readerList})

      AND (@date IS NULL OR
           CAST(
               DATEADD(
                   SECOND,
                   E.nDateTime,
                   '1970-01-01'
               ) AS DATE
           ) = @date)

      AND (@employeeId IS NULL OR U.sUserID = @employeeId)

      AND (
          @search IS NULL
          OR U.sUserID LIKE '%' + @search + '%'
          OR U.sUserName LIKE '%' + @search + '%'
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
) AS DailyRecords;
`;
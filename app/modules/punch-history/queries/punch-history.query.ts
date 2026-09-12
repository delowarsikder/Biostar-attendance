export const GET_PUNCH_HISTORY_QUERY = `
SELECT
    E.nEventLogIdn AS PunchId,

    CAST(E.nUserID AS VARCHAR(64)) AS EmployeeId,

    U.sUserName AS EmployeeName,

    CONVERT(
        VARCHAR(19),
        DATEADD(
            SECOND,
            E.nDateTime,
            '1970-01-01'
        ),
        120
    ) AS EventDateTime,

    E.nReaderIdn AS ReaderId,

    R.sName AS ReaderName,

    CASE
        WHEN E.nReaderIdn IN (
            539338120,
            539339462,
            539339471,
            539339528
        )
        THEN 'IN'

        WHEN E.nReaderIdn IN (
            539338112,
            539339465,
            539339470,
            539339534
        )
        THEN 'OUT'

        ELSE 'UNKNOWN'
    END AS Direction,

    E.nEventIdn AS EventId

FROM TB_EVENT_LOG E

LEFT JOIN TB_USER U
    ON CAST(E.nUserID AS VARCHAR(64)) = U.sUserID

LEFT JOIN TB_READER R
    ON E.nReaderIdn = R.nReaderIdn

WHERE
    E.nEventIdn = 55

    AND E.nReaderIdn IN (
        539338112,
        539338120,
        539339462,
        539339465,
        539339470,
        539339471,
        539339528,
        539339534
    )

    AND CAST(E.nUserID AS VARCHAR(64)) = @employeeId

    AND DATEADD(
        SECOND,
        E.nDateTime,
        '1970-01-01'
    ) >= CAST(@date AS DATE)

    AND DATEADD(
        SECOND,
        E.nDateTime,
        '1970-01-01'
    ) < DATEADD(
        DAY,
        1,
        CAST(@date AS DATE)
    )

ORDER BY
    E.nDateTime ASC,
    E.nEventLogIdn ASC;
`;
import { NextRequest, NextResponse } from "next/server";
import { getBioStarDB } from "@/lib/database/biostar/db";

const OFFICE_START = "09:00";
const OFFICE_END = "18:00";

type PunchType = "IN" | "OUT" | "UNKNOWN";

interface Punch {
    nEventLogIdn: number;
    punchDateTime: string | Date;
    nReaderIdn: number;
    readerName: string | null;
    nEventIdn: number;
    nUserID: number;
    nIsLog: number;
    nTNAEvent: number;
    nIsUseTA: number;
    nType: number;
}

interface EmployeePunches {
    userId: number;
    inPunches: Punch[];
    outPunches: Punch[];
    unknownPunches: Punch[];
}

/**
 * Convert database punch datetime into the API's
 * Bangladesh local datetime representation.
 *
 * IMPORTANT:
 * BioStar device data shown in the attendance screen
 * is already local Bangladesh time.
 *
 * Therefore we DO NOT add +6 hours here.
 */
function formatLocalDateTime(value: Date | string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+06:00`;
}

/**
 * Determine whether a reader is an IN reader or OUT reader.
 *
 * Examples:
 *   Ad-In
 *   T1-In
 *   HR-In
 *   T2-In
 *
 * are IN readers.
 *
 * Examples:
 *   T1-Out
 *   T2-Out
 *
 * are OUT readers.
 */
function getPunchType(readerName: string | null): PunchType {
    if (!readerName) {
        return "UNKNOWN";
    }

    const name = readerName.toLowerCase();

    if (name.includes("-in")) {
        return "IN";
    }

    if (name.includes("-out")) {
        return "OUT";
    }

    return "UNKNOWN";
}

/**
 * Get minutes since midnight.
 *
 * The database value is treated as the local clock time
 * represented by the BioStar device.
 */
function minutesFromMidnight(value: Date | string): number {
    const date = new Date(value);

    return (
        date.getUTCHours() * 60 +
        date.getUTCMinutes()
    );
}

/**
 * Convert HH:mm into minutes since midnight.
 */
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}

export async function GET(request: NextRequest) {
    try {
        /*
         * ---------------------------------------------------------
         * 1. Get requested date
         * ---------------------------------------------------------
         */

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");

        if (!date) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Date is required",
                },
                { status: 400 }
            );
        }

        /*
         * Validate YYYY-MM-DD
         */
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Date must be in YYYY-MM-DD format",
                },
                { status: 400 }
            );
        }

        /*
         * ---------------------------------------------------------
         * 2. Office schedule
         * ---------------------------------------------------------
         */

        const officeStartMinutes =
            timeToMinutes(OFFICE_START);

        const officeEndMinutes =
            timeToMinutes(OFFICE_END);

        /*
         * ---------------------------------------------------------
         * 3. Database connection
         * ---------------------------------------------------------
         */

        const pool = await getBioStarDB();

        /*
         * ---------------------------------------------------------
         * 4. Get BioStar punches
         * ---------------------------------------------------------
         *
         * IMPORTANT:
         *
         * BioStar device time shown in your screenshot is:
         *
         * 2026-09-02 08:57:47
         *
         * Therefore we do NOT subtract 6 hours from the
         * requested date.
         *
         * The database timestamp is treated as the local
         * Bangladesh attendance timestamp.
         */

        const result = await pool
            .request()
            .input("date", date)
            .query(`
                SELECT
                    el.nEventLogIdn,

                    DATEADD(
                        SECOND,
                        el.nDateTime,
                        '1970-01-01'
                    ) AS punchDateTime,

                    el.nReaderIdn,
                    r.sName AS readerName,

                    el.nEventIdn,
                    el.nUserID,
                    el.nIsLog,
                    el.nTNAEvent,
                    el.nIsUseTA,
                    el.nType

                FROM TB_EVENT_LOG el

                LEFT JOIN TB_READER r
                    ON r.nReaderIdn = el.nReaderIdn

                WHERE el.nEventIdn = 55
                AND el.nIsUseTA = 1

                AND el.nDateTime >= DATEDIFF(
                    SECOND,
                    '1970-01-01',
                    CONVERT(datetime, @date)
                )

                AND el.nDateTime < DATEDIFF(
                    SECOND,
                    '1970-01-01',
                    DATEADD(
                        DAY,
                        1,
                        CONVERT(datetime, @date)
                    )
                )

                ORDER BY
                    el.nUserID ASC,
                    el.nDateTime ASC,
                    el.nEventLogIdn ASC
            `);

        const punches =
            result.recordset as Punch[];

        /*
         * ---------------------------------------------------------
         * 5. Group punches by employee
         * ---------------------------------------------------------
         */

        const employeeMap =
            new Map<number, EmployeePunches>();

        for (const punch of punches) {
            const userId = Number(punch.nUserID);

            if (!employeeMap.has(userId)) {
                employeeMap.set(userId, {
                    userId,
                    inPunches: [],
                    outPunches: [],
                    unknownPunches: [],
                });
            }

            const employee =
                employeeMap.get(userId)!;

            const type =
                getPunchType(punch.readerName);

            if (type === "IN") {
                employee.inPunches.push(punch);
            } else if (type === "OUT") {
                employee.outPunches.push(punch);
            } else {
                employee.unknownPunches.push(punch);
            }
        }

        /*
         * ---------------------------------------------------------
         * 6. Calculate attendance for every punched employee
         * ---------------------------------------------------------
         */

        const attendance = [];

        for (const employee of employeeMap.values()) {
            /*
             * First IN
             *
             * Because SQL is ordered ascending by datetime,
             * the first item is the employee's first arrival.
             */
            const firstIn =
                employee.inPunches.length > 0
                    ? employee.inPunches[0]
                    : null;

            /*
             * Last OUT
             *
             * Because SQL is ordered ascending by datetime,
             * the last OUT is the employee's final departure.
             */
            const lastOut =
                employee.outPunches.length > 0
                    ? employee.outPunches[
                          employee.outPunches.length - 1
                      ]
                    : null;

            /*
             * -----------------------------------------------------
             * Late calculation
             * -----------------------------------------------------
             */

            let lateMinutes = 0;

            if (firstIn) {
                const actualInMinutes =
                    minutesFromMidnight(
                        firstIn.punchDateTime
                    );

                lateMinutes = Math.max(
                    0,
                    actualInMinutes -
                        officeStartMinutes
                );
            }

            const isLate = lateMinutes > 0;

            /*
             * -----------------------------------------------------
             * Early leave calculation
             * -----------------------------------------------------
             */

            let earlyLeaveMinutes = 0;

            if (lastOut) {
                const actualOutMinutes =
                    minutesFromMidnight(
                        lastOut.punchDateTime
                    );

                earlyLeaveMinutes = Math.max(
                    0,
                    officeEndMinutes -
                        actualOutMinutes
                );
            }

            const isEarlyLeave =
                earlyLeaveMinutes > 0;

            /*
             * -----------------------------------------------------
             * Working minutes
             * -----------------------------------------------------
             */

            let workedMinutes:
                | number
                | null = null;

            if (firstIn && lastOut) {
                const inDate =
                    new Date(
                        firstIn.punchDateTime
                    );

                const outDate =
                    new Date(
                        lastOut.punchDateTime
                    );

                const difference =
                    outDate.getTime() -
                    inDate.getTime();

                workedMinutes = Math.max(
                    0,
                    Math.floor(
                        difference / 60000
                    )
                );
            }

            /*
             * -----------------------------------------------------
             * Status
             * -----------------------------------------------------
             *
             * Priority:
             *
             * IN + no OUT
             *     -> MISSING_OUT
             *
             * IN + OUT + late + early
             *     -> LATE_AND_EARLY
             *
             * IN + OUT + late
             *     -> LATE
             *
             * IN + OUT + early
             *     -> EARLY_LEAVE
             *
             * IN + OUT normal
             *     -> PRESENT
             */

            let status:
                | "PRESENT"
                | "LATE"
                | "EARLY_LEAVE"
                | "LATE_AND_EARLY"
                | "MISSING_OUT"
                | "ABSENT";

            if (!firstIn) {
                status = "ABSENT";
            } else if (!lastOut) {
                status = "MISSING_OUT";
            } else if (isLate && isEarlyLeave) {
                status = "LATE_AND_EARLY";
            } else if (isLate) {
                status = "LATE";
            } else if (isEarlyLeave) {
                status = "EARLY_LEAVE";
            } else {
                status = "PRESENT";
            }

            attendance.push({
                userId: employee.userId,

                firstIn: firstIn
                    ? formatLocalDateTime(
                          firstIn.punchDateTime
                      )
                    : null,

                lastOut: lastOut
                    ? formatLocalDateTime(
                          lastOut.punchDateTime
                      )
                    : null,

                workedMinutes,

                lateMinutes,

                isLate,

                earlyLeaveMinutes,

                isEarlyLeave,

                status,

                firstInReader:
                    firstIn?.readerName ?? null,

                lastOutReader:
                    lastOut?.readerName ?? null,

                totalInPunches:
                    employee.inPunches.length,

                totalOutPunches:
                    employee.outPunches.length,

                unknownPunches:
                    employee.unknownPunches.length,
            });
        }

        /*
         * ---------------------------------------------------------
         * 7. Sort attendance by user ID
         * ---------------------------------------------------------
         */

        attendance.sort(
            (a, b) => a.userId - b.userId
        );

        /*
         * ---------------------------------------------------------
         * 8. Summary
         * ---------------------------------------------------------
         *
         * NOTE:
         *
         * "totalPunchUsers" means users who have at least
         * one attendance punch.
         *
         * We cannot calculate TRUE ABSENT employees yet because
         * this endpoint currently only queries TB_EVENT_LOG.
         *
         * Once we identify the BioStar user/employee table,
         * we can compare all employees against today's punches.
         */

        const summary = {
            totalPunchUsers: attendance.length,

            present: attendance.filter(
                (x) => x.status === "PRESENT"
            ).length,

            late: attendance.filter(
                (x) =>
                    x.status === "LATE" ||
                    x.status === "LATE_AND_EARLY"
            ).length,

            missingOut: attendance.filter(
                (x) =>
                    x.status === "MISSING_OUT"
            ).length,

            earlyLeave: attendance.filter(
                (x) =>
                    x.status === "EARLY_LEAVE" ||
                    x.status === "LATE_AND_EARLY"
            ).length,

            absent: attendance.filter(
                (x) => x.status === "ABSENT"
            ).length,
        };

        /*
         * ---------------------------------------------------------
         * 9. Response
         * ---------------------------------------------------------
         */

        return NextResponse.json({
            success: true,

            date,

            timezone: "Asia/Dhaka",

            schedule: {
                start: OFFICE_START,
                end: OFFICE_END,
            },

            summary,

            attendance,
        });
    } catch (error) {
        console.error(
            "Attendance aggregation error:",
            error
        );

        return NextResponse.json(
            {
                success: false,

                message:
                    "Failed to fetch attendance data",

                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { getBioStarDB } from "@/lib/biostar/db";

const SHIFT_START = 9 * 60; // 09:00 = 540 minutes
const SHIFT_END = 17 * 60; // 17:00 = 1020 minutes

function formatTime(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "—";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Date is required. Use YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    const pool = await getBioStarDB();

    const result = await pool
      .request()
      .input("date", date)
      .query(`
    SELECT
      r.nDateTime,
      r.nUserIdn,

      u.sUserName,
      u.sUserID,

      u.nDepartmentIdn AS departmentId,
      d.sName AS departmentName,

      r.nShiftIdn,
      r.nDailyScheduleIdn,
      r.nStartTime,
      r.nEndTime,
      r.sStartEvent,
      r.sEndEvent,
      r.nTAResult,
      r.nWorkTime,
      r.nIsModify,
      r.nLateInTime,
      r.nEarlyOutTime

    FROM TB_TA_RESULT r

    INNER JOIN TB_USER u
      ON u.nUserIdn = r.nUserIdn

    LEFT JOIN TB_USER_DEPT d
      ON d.nDepartmentIdn = u.nDepartmentIdn

    WHERE CONVERT(
      date,
      DATEADD(SECOND, r.nDateTime, '1970-01-01')
    ) = CONVERT(date, @date)

    ORDER BY u.sUserName
  `);

    const attendance = result.recordset.map((record: any) => {
      const firstIn = Number(record.nStartTime) || 0;
      const lastOut = Number(record.nEndTime) || 0;

      const hasAttendance = firstIn > 0;
      const hasCheckout = lastOut > 0;

      // BioStar nStartTime/nEndTime are assumed to be
      // minutes from midnight.
      const presenceSeconds =
        hasAttendance && hasCheckout && lastOut > firstIn
          ? (lastOut - firstIn) * 60
          : 0;

      const lateMinutes =
        hasAttendance && firstIn > SHIFT_START
          ? firstIn - SHIFT_START
          : 0;

      const earlyOutMinutes =
        hasCheckout && lastOut < SHIFT_END
          ? SHIFT_END - lastOut
          : 0;

      let status: string;

      if (!hasAttendance) {
        status = "Absent";
      } else if (!hasCheckout) {
        status = "Incomplete";
      } else if (firstIn > SHIFT_START && lastOut < SHIFT_END) {
        status = "Late / Early Out";
      } else if (firstIn > SHIFT_START) {
        status = "Late";
      } else if (lastOut < SHIFT_END) {
        status = "Early Out";
      } else {
        status = "Present";
      }

      return {
        employeeId: record.sUserID ?? null,
        name: record.sUserName ?? null,

        departmentId: record.departmentId ?? null,
        departmentName: record.departmentName ?? null,

        shiftId: record.nShiftIdn ?? 2,
        shiftName: "General Shift",

        firstIn,
        lastOut,

        firstInFormatted: hasAttendance
          ? formatTime(firstIn)
          : null,

        lastOutFormatted: hasCheckout
          ? formatTime(lastOut)
          : null,

        presenceSeconds,
        presenceTime: formatDuration(presenceSeconds),

        workTimeSeconds: presenceSeconds,
        workTime: formatDuration(presenceSeconds),

        lateMinutes,
        earlyOutMinutes,

        status,

        nTAResult: record.nTAResult ?? null,
        nIsModify: record.nIsModify ?? null,
      };

    });

    return NextResponse.json({
      success: true,
      date,

      shift: {
        id: 2,
        name: "General Shift",
        start: "09:00",
        end: "17:00",
      },

      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Daily attendance error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve daily attendance",
      },
      { status: 500 }
    );
  }
}

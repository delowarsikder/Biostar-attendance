import { NextRequest, NextResponse } from "next/server";
import { getBioStarDB } from "@/lib/biostar/db";

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
          u.nDepartmentIdn,
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
        WHERE CONVERT(date, DATEADD(SECOND, r.nDateTime, '1970-01-01'))
              = CONVERT(date, @date)
        ORDER BY u.sUserName
      `);

    return NextResponse.json({
      success: true,
      date,
      count: result.recordset.length,
      attendance: result.recordset,
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

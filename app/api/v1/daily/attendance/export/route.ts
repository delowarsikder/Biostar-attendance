import { NextRequest, NextResponse } from "next/server";

import { attendanceRepository } from "@/app/modules/attendance/attendance.repository";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const date =
      searchParams.get("date") || undefined;

    const employeeId =
      searchParams.get("employeeId") ||
      undefined;

    const search =
      searchParams.get("search") ||
      undefined;

    const departmentIdValue =
      searchParams.get("departmentId");

    const departmentId =
      departmentIdValue !== null
        ? Number(departmentIdValue)
        : undefined;

    const format =
      searchParams.get("format") || "json";

    /*
     * Fetch ALL records without pagination for export
     */
    const result =
      await attendanceRepository.findDailyAttendanceForExport({
        date,
        employeeId,
        search,
        departmentId,
      });

    if (format === "excel" || format === "pdf") {
      /*
       * For Excel/PDF, we'll return JSON and let the client handle export
       * using the export utilities. This keeps the API simple and avoids
       * server-side binary generation complexity.
       */
      return NextResponse.json({
        success: true,
        data: result.records,
        summary: result.summary,
        total: result.total,
      });
    }

    return NextResponse.json({
      success: true,
      data: result.records,
      summary: result.summary,
      total: result.total,
    });
  } catch (error) {
    console.error(
      "Attendance export API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to retrieve attendance data for export.",
      },
      { status: 500 }
    );
  }
}
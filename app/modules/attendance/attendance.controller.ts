import { NextRequest, NextResponse } from "next/server";

import { attendanceService } from "./attendance.service";

export async function getAttendance(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const page = Math.max(
      1,
      Number(searchParams.get("page") || 1)
    );

    const pageSize = Math.min(
      100,
      Math.max(
        1,
        Number(
          searchParams.get("pageSize") || 25
        )
      )
    );

    const date =
      searchParams.get("date") || undefined;

    const employeeId =
      searchParams.get("employeeId") ||
      undefined;

    const search =
      searchParams.get("search") ||
      undefined;

    const result =
      await attendanceService.getAttendance({
        date,
        employeeId,
        search,
        page,
        pageSize,
      });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Attendance API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to retrieve attendance data.",
      },
      { status: 500 }
    );
  }
}
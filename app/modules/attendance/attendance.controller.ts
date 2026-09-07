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

    const departmentIdValue =
      searchParams.get("departmentId");

    const departmentId =
      departmentIdValue !== null
        ? Number(departmentIdValue)
        : undefined;

    const reader =
      searchParams.get("reader")?.trim() || undefined;

    const readerIdValue =
      searchParams.get("readerId");

    const readerId =
      readerIdValue !== null
        ? Number(readerIdValue)
        : undefined;

    const status =
      searchParams.get("status")?.trim() || undefined;

    if (date && !isValidDate(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Expected YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    if (
      departmentId !== undefined &&
      (!Number.isInteger(departmentId) || departmentId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "departmentId must be a positive integer",
        },
        { status: 400 }
      );
    }

    if (
      readerId !== undefined &&
      (!Number.isInteger(readerId) || readerId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "readerId must be a positive integer",
        },
        { status: 400 }
      );
    }

    if (
      page !== undefined &&
      (!Number.isInteger(page) || page < 1)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "page must be a positive integer",
        },
        { status: 400 }
      );
    }

    if (
      pageSize !== undefined &&
      (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "pageSize must be between 1 and 100",
        },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      status !== "all" &&
      !["present", "no_attendance", "late", "early_out"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "status must be present, no_attendance, late, or early_out",
        },
        { status: 400 }
      );
    }

    const result =
      await attendanceService.getAttendance({
        date,
        employeeId,
        search,
        departmentId,
        reader,
        readerId,
        status,
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

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
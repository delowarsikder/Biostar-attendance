import { NextRequest, NextResponse } from "next/server";
import { attendanceRepository } from "@/app/modules/attendance/attendance.repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const search = searchParams.get("search") || undefined;
    const departmentName = searchParams.get("departmentName")?.trim() || undefined;

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Date is required for export.",
        },
        { status: 400 }
      );
    }

    // Use the main method that already works
    const result = await attendanceRepository.findDailyAttendance({
      date,
      employeeId,
      search,
      departmentName,
      page: 1,
      pageSize: 99999, // Get all records for export
    });

    return NextResponse.json({
      success: true,
      data: result.records || [],
      summary: result.summary || {},
      total: result.total || 0,
    });
  } catch (error) {
    console.error("❌ Attendance export API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to retrieve attendance data for export.",
      },
      { status: 500 }
    );
  }
}
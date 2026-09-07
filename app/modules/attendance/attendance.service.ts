// app/modules/attendance/attendance.service.ts

import { attendanceRepository } from "./attendance.repository";
import type { AttendanceFilters, AttendanceResponse } from "./attendance.types";

export class AttendanceService {
  async getAttendance(filters: AttendanceFilters): Promise<AttendanceResponse> {
    // Fetch attendance data and departments in parallel
    const [result, departments] = await Promise.all([
      attendanceRepository.findDailyAttendance(filters),
      attendanceRepository.getDepartments(),
    ]);

    const totalPages =
      result.total === 0 ? 0 : Math.ceil(result.total / filters.pageSize);

    return {
      data: result.records,
      summary: result.summary,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages,
      },
      departments,
    };
  }
}

export const attendanceService = new AttendanceService();
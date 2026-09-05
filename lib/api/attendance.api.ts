import { apiClient } from "./client";

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;

  departmentId: number | null;
  departmentName: string | null;

  attendanceDate: string;

  firstPunch: string | null;
  firstPunchReader: string | null;

  lastPunch: string | null;
  lastPunchReader: string | null;

  totalPunches: number;
  stayTime: string;

  // Attendance flags
  hasAttendance: boolean;
  isPresent: boolean;
  isLate: boolean;
  isEarlyOut: boolean;

  // Human-readable combined status
  attendanceStatus: string;
}

export interface AttendanceSummary {
  totalEmployees: number;
  present: number;
  noAttendance: number;
  late: number;
  earlyOut: number;
}

export interface AttendancePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AttendanceResponse {
  success: boolean;

  data: AttendanceRecord[];

  summary: AttendanceSummary;

  pagination: AttendancePagination;

  message?: string;
}

interface AttendanceParams {
  date: string;

  employeeId?: string;

  page?: number;
  pageSize?: number;

  search?: string;
  departmentId?: number;
}

/**
 * Get daily attendance.
 *
 * Pagination is handled by the API.
 *
 * Example:
 *
 * page = 1, pageSize = 25
 * -> employees 1-25
 *
 * page = 2, pageSize = 25
 * -> employees 26-50
 *
 * page = 3, pageSize = 25
 * -> employees 51-75
 *
 * page = 4, pageSize = 25
 * -> employees 76-90
 */
export async function getAttendance(
  params: AttendanceParams
): Promise<AttendanceResponse> {
  const searchParams = new URLSearchParams();

  /*
   * Required date.
   */
  searchParams.set(
    "date",
    params.date
  );

  /*
   * Employee ID filter.
   */
  if (params.employeeId) {
    searchParams.set(
      "employeeId",
      params.employeeId
    );
  }

  /*
   * Pagination.
   *
   * These are important.
   *
   * The frontend will control the current page.
   */
  searchParams.set(
    "page",
    String(params.page ?? 1)
  );

  searchParams.set(
    "pageSize",
    String(params.pageSize ?? 25)
  );

  /*
   * Employee search.
   */
  if (params.search) {
    searchParams.set(
      "search",
      params.search
    );
  }

  /*
   * Department filter.
   */
  if (
    params.departmentId !== undefined
  ) {
    searchParams.set(
      "departmentId",
      String(params.departmentId)
    );
  }

  /*
   * Call API.
   *
   * Example generated URL:
   *
   * /api/v1/daily/attendance
   *   ?date=2026-09-05
   *   &page=1
   *   &pageSize=25
   */
  return apiClient<AttendanceResponse>(
    `/api/v1/daily/attendance?${searchParams.toString()}`
  );
}

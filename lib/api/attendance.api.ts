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

/*
 * Parameters accepted by the attendance API.
 */
export interface AttendanceParams {
  /*
   * Required
   */
  date: string;

  /*
   * Employee ID
   */
  employeeId?: string;

  /*
   * Pagination
   */
  page?: number;
  pageSize?: number;

  /*
   * Employee search
   */
  search?: string;

  /*
   * Department filter
   */
  departmentId?: number;

  /*
   * Reader filter
   *
   * Example:
   * HR-In
   * HR-Out
   * Ad-In
   */
  reader?: string;

  /*
   * Status filter
   *
   * Possible values:
   *
   * present
   * no_attendance
   * late
   * early_out
   */
  status?: string;
}

/**
 * Get daily attendance.
 *
 * Pagination and filtering are handled by the API.
 *
 * Example:
 *
 * page = 1, pageSize = 25
 * -> first 25 matching employees
 *
 * page = 2, pageSize = 25
 * -> next 25 matching employees
 */
export async function getAttendance(
  params: AttendanceParams
): Promise<AttendanceResponse> {
  const searchParams = new URLSearchParams();

  /*
   * ----------------------------------------
   * Required date
   * ----------------------------------------
   */

  searchParams.set(
    "date",
    params.date
  );

  /*
   * ----------------------------------------
   * Employee ID
   * ----------------------------------------
   */

  if (params.employeeId) {
    searchParams.set(
      "employeeId",
      params.employeeId
    );
  }

  /*
   * ----------------------------------------
   * Pagination
   * ----------------------------------------
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
   * ----------------------------------------
   * Employee search
   * ----------------------------------------
   */

  if (params.search?.trim()) {
    searchParams.set(
      "search",
      params.search.trim()
    );
  }

  /*
   * ----------------------------------------
   * Department
   * ----------------------------------------
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
   * ----------------------------------------
   * Reader
   * ----------------------------------------
   */

  if (
    params.reader &&
    params.reader !== "all"
  ) {
    searchParams.set(
      "reader",
      params.reader
    );
  }

  /*
   * ----------------------------------------
   * Status
   * ----------------------------------------
   */

  if (
    params.status &&
    params.status !== "all"
  ) {
    searchParams.set(
      "status",
      params.status
    );
  }

  /*
   * ----------------------------------------
   * API request
   * ----------------------------------------
   *
   * Example:
   *
   * /api/v1/daily/attendance
   *   ?date=2026-09-05
   *   &page=1
   *   &pageSize=25
   *   &reader=HR-In
   *   &status=early_out
   *
   */

  return apiClient<AttendanceResponse>(
    `/api/v1/daily/attendance?${searchParams.toString()}`
  );
}

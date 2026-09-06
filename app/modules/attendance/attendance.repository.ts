import sql from "mssql";

import { getBioStarDB } from "@/lib/database/biostar/db";

import {
  ATTENDANCE_QUERY,
  ATTENDANCE_COUNT_QUERY,
  ATTENDANCE_SUMMARY_QUERY,
} from "./queries/attendance.query";

import type {
  AttendanceFilters,
  AttendanceRecord,
} from "./attendance.types";

interface AttendanceQueryRow {
  EmployeeID: string | number;
  EmployeeName: string | null;

  DepartmentID: string | number | null;
  DepartmentName: string | null;

  AttendanceDate: Date | string | null;

  FirstPunch: Date | string | null;
  FirstPunchReader: string | null;

  LastPunch: Date | string | null;
  LastPunchReader: string | null;

  TotalPunches: number | string | null;
  StaySeconds: number | string | null;

  HasAttendance: number | string | boolean | null;
  IsPresent: number | string | boolean | null;
  IsLate: number | string | boolean | null;
  IsEarlyOut: number | string | boolean | null;

  nStartTime: number | string | null;
  nEndTime: number | string | null;
  nTAResult: number | string | null;
  nWorkTime: number | string | null;
  nLateInTime: number | string | null;
  nEarlyOutTime: number | string | null;
  nIsModify: number | string | null;
}

interface AttendanceCountRow {
  Total: number | string | null;
}

interface AttendanceSummaryRow {
  TotalEmployees: number | string | null;
  Present: number | string | null;
  NoAttendance: number | string | null;
  Late: number | string | null;
  EarlyOut: number | string | null;
}

export class AttendanceRepository {
  async findDailyAttendance(
    filters: AttendanceFilters
  ): Promise<{
    records: AttendanceRecord[];
    total: number;
    summary: {
      totalEmployees: number;
      present: number;
      noAttendance: number;
      late: number;
      earlyOut: number;
    };
  }> {
    const pool = await getBioStarDB();

    /*
     * Pagination offset.
     *
     * page 1, pageSize 25 -> 0
     * page 2, pageSize 25 -> 25
     * page 3, pageSize 25 -> 50
     */
    const offset =
      (filters.page - 1) * filters.pageSize;

    /*
     * Convert optional filters to null.
     *
     * The SQL queries use:
     * @parameter IS NULL
     */
    const date =
      filters.date || null;

    const employeeId =
      filters.employeeId || null;

    const search =
      filters.search || null;

    const departmentId =
      filters.departmentId !== undefined &&
        filters.departmentId !== null
        ? filters.departmentId
        : null;

    /*
     * Create SQL request.
     */
    const request = pool.request();

    /*
     * Date.
     */
    request.input(
      "date",
      sql.Date,
      date
    );

    /*
     * Employee ID.
     */
    request.input(
      "employeeId",
      sql.VarChar(64),
      employeeId
    );

    /*
     * Employee ID/name search.
     */
    request.input(
      "search",
      sql.NVarChar(96),
      search
    );

    /*
     * Department.
     */
    request.input(
      "departmentId",
      sql.Int,
      departmentId
    );

    /*
     * Pagination.
     */
    request.input(
      "offset",
      sql.Int,
      offset
    );

    request.input(
      "pageSize",
      sql.Int,
      filters.pageSize
    );

    /*
     * Execute:
     *
     * Recordset 0 -> paginated attendance records
     * Recordset 1 -> total employee count
     * Recordset 2 -> full attendance summary
     */
    const result = await request.batch(`
      ${ATTENDANCE_QUERY}

      ${ATTENDANCE_COUNT_QUERY}

      ${ATTENDANCE_SUMMARY_QUERY}
    `);

    /*
     * SQL Server returns the three SELECT results
     * as separate recordsets.
     */
    const recordsets =
      result.recordsets as unknown as [
        AttendanceQueryRow[],
        AttendanceCountRow[],
        AttendanceSummaryRow[]
      ];

    /*
     * -------------------------------
     * 1. Attendance records
     * -------------------------------
     */
    const attendanceResult =
      recordsets[0] ?? [];

    /*
     * -------------------------------
     * 2. Total employees
     * -------------------------------
     */
    const countResult =
      recordsets[1] ?? [];

    const total =
      Number(
        countResult[0]?.Total ?? 0
      );

    /*
     * -------------------------------
     * 3. Full summary
     * -------------------------------
     *
     * IMPORTANT:
     *
     * This does NOT use `records`.
     *
     * The SQL summary query calculates
     * values across ALL matching employees,
     * before pagination.
     */
    const summaryResult =
      recordsets[2] ?? [];

    const summaryRow =
      summaryResult[0];

    const summary = {
      totalEmployees:
        Number(
          summaryRow?.TotalEmployees ?? 0
        ),

      present:
        Number(
          summaryRow?.Present ?? 0
        ),

      noAttendance:
        Number(
          summaryRow?.NoAttendance ?? 0
        ),

      late:
        Number(
          summaryRow?.Late ?? 0
        ),

      earlyOut:
        Number(
          summaryRow?.EarlyOut ?? 0
        ),
    };

    /*
     * -------------------------------
     * Convert SQL records to API records
     * -------------------------------
     */
    const records: AttendanceRecord[] =
      attendanceResult.map((row) => {
        /*
         * Total valid punches.
         */
        const totalPunches =
          Number(
            row.TotalPunches ?? 0
          );

        /*
         * Stay duration in seconds.
         */
        const staySeconds =
          Number(
            row.StaySeconds ?? 0
          );

        /*
         * Attendance exists when
         * at least one punch exists.
         */
        const hasAttendance =
          totalPunches > 0;

        /*
         * Present follows the same rule.
         */
        const isPresent =
          hasAttendance;

        /*
         * Late.
         */
        const isLate =
          Number(
            row.nLateInTime ?? 0
          ) > 0;

        /*
         * Early out.
         */
        const isEarlyOut =
          Number(
            row.nEarlyOutTime ?? 0
          ) > 0;

        /*
         * Human-readable status.
         */
        const attendanceStatus =
          !hasAttendance
            ? "No Attendance"
            : "Present";

        return {
          employeeId:
            String(
              row.EmployeeID
            ),

          employeeName:
            row.EmployeeName ??
            "Unknown",

          departmentId:
            row.DepartmentID !== null &&
              row.DepartmentID !== undefined
              ? Number(
                row.DepartmentID
              )
              : null,

          departmentName:
            row.DepartmentName ??
            null,

          attendanceDate:
            this.formatDateTime(
              row.AttendanceDate
            ),

          firstPunch:
            this.formatDateTime(
              row.FirstPunch
            ),

          firstPunchReader:
            row.FirstPunchReader ??
            "",

          lastPunch:
            this.formatDateTime(
              row.LastPunch
            ),

          lastPunchReader:
            row.LastPunchReader ??
            "",

          totalPunches,

          stayTime:
            this.formatDuration(
              staySeconds
            ),

          hasAttendance,

          isPresent,

          isLate,

          isEarlyOut,

          attendanceStatus,
        };
      });

    /*
     * Final response.
     *
     * `records` = current page only.
     *
     * `total` = all filtered employees.
     *
     * `summary` = all filtered employees,
     *              NOT just the current page.
     */
    return {
      records,
      total,
      summary,
    };
  }
  // app/modules/attendance/attendance.repository.ts

  // Add this method
  async getDepartments(): Promise<string[]> {
    const pool = await getBioStarDB();
    const result = await pool.request().query(`
    SELECT DISTINCT sName AS DepartmentName
    FROM TB_USER_DEPT
    WHERE sName IS NOT NULL
    ORDER BY sName
  `);
    return result.recordset.map((row: any) => row.DepartmentName);
  }
  /**
   * Converts SQL date/time values to a string.
   */
  private formatDateTime(
    value: Date | string | null
  ): string {
    return value
      ? String(value)
      : "";
  }

  /**
   * Converts seconds into HH:mm:ss.
   *
   * Example:
   *
   * 0    -> 00:00:00
   * 4    -> 00:00:04
   * 60   -> 00:01:00
   * 3600 -> 01:00:00
   */
  private formatDuration(
    totalSeconds: number
  ): string {
    const seconds =
      Math.max(
        0,
        Math.floor(
          totalSeconds || 0
        )
      );

    const hours =
      Math.floor(
        seconds / 3600
      );

    const minutes =
      Math.floor(
        (seconds % 3600) / 60
      );

    const remainingSeconds =
      seconds % 60;

    return [
      String(hours).padStart(
        2,
        "0"
      ),

      String(minutes).padStart(
        2,
        "0"
      ),

      String(
        remainingSeconds
      ).padStart(
        2,
        "0"
      ),
    ].join(":");
  }
}

export const attendanceRepository =
  new AttendanceRepository();

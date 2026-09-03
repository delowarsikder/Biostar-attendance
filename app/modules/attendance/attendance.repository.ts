import sql from "mssql";

import { getBioStarDB } from "@/lib/database/biostar/db";

import {
  ATTENDANCE_QUERY,
  ATTENDANCE_COUNT_QUERY,
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
}

interface AttendanceCountRow {
  Total: number | string | null;
}

export class AttendanceRepository {
  async findDailyAttendance(
    filters: AttendanceFilters
  ): Promise<{
    records: AttendanceRecord[];
    total: number;
  }> {
    const pool = await getBioStarDB();

    const offset =
      (filters.page - 1) * filters.pageSize;

    const date =
      filters.date || null;

    const employeeId =
      filters.employeeId || null;

    const search =
      filters.search || null;

    const request = pool.request();

    request.input(
      "date",
      sql.Date,
      date
    );

    request.input(
      "employeeId",
      sql.VarChar(64),
      employeeId
    );

    request.input(
      "search",
      sql.NVarChar(96),
      search
    );

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

    const result = await request.batch(`
      ${ATTENDANCE_QUERY}

      ${ATTENDANCE_COUNT_QUERY}
    `);

    /*
     * request.batch() returns multiple recordsets.
     *
     * Recordset 1:
     * Daily attendance records
     *
     * Recordset 2:
     * Total attendance count
     */
    const recordsets =
      result.recordsets as unknown as [
        AttendanceQueryRow[],
        AttendanceCountRow[]
      ];

    const attendanceResult =
      recordsets[0] ?? [];

    const countResult =
      recordsets[1] ?? [];

    const total = Number(
      countResult[0]?.Total ?? 0
    );

    const records: AttendanceRecord[] =
      attendanceResult.map((row) => ({
        employeeId:
          String(row.EmployeeID),

        employeeName:
          row.EmployeeName ?? "Unknown",

        departmentId:
          row.DepartmentID !== null &&
          row.DepartmentID !== undefined
            ? Number(row.DepartmentID)
            : null,

        departmentName:
          row.DepartmentName ?? null,

        attendanceDate:
          this.formatDateTime(
            row.AttendanceDate
          ),

        firstPunch:
          this.formatDateTime(
            row.FirstPunch
          ),

        firstPunchReader:
          row.FirstPunchReader ?? "",

        lastPunch:
          this.formatDateTime(
            row.LastPunch
          ),

        lastPunchReader:
          row.LastPunchReader ?? "",

        totalPunches:
          Number(row.TotalPunches),

        stayTime:
          this.formatDuration(
            Number(row.StaySeconds)
          ),

        attendanceStatus:
          "Present",
      }));

    return {
      records,
      total,
    };
  }

  /**
   * Converts SQL date/time values
   * to strings.
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
   */
  private formatDuration(
    totalSeconds: number
  ): string {
    const seconds = Math.max(
      0,
      totalSeconds
    );

    const hours = Math.floor(
      seconds / 3600
    );

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const remainingSeconds =
      seconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(remainingSeconds).padStart(2, "0"),
    ].join(":");
  }
}

export const attendanceRepository =
  new AttendanceRepository();
  
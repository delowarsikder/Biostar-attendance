import sql from "mssql";

import { getBioStarDB } from "@/lib/database/biostar/db";

import { GET_PUNCH_HISTORY_QUERY } from "./queries/punch-history.query";

import {
  PunchHistoryFilters,
  PunchHistoryItem,
} from "./punch-history.types";

interface PunchHistoryRow {
  PunchId: number;
  EmployeeId: string;
  EmployeeName: string;
  EventDateTime: string;
  ReaderId: number;
  ReaderName: string;
  Direction: "IN" | "OUT" | "UNKNOWN";
  EventId: number;
}

export class PunchHistoryRepository {
  async getPunchHistory(
    filters: PunchHistoryFilters
  ): Promise<PunchHistoryItem[]> {
    const pool = await getBioStarDB();

    const request = pool.request();

    request.input(
      "employeeId",
      sql.VarChar(64),
      filters.employeeId
    );

    request.input(
      "date",
      sql.VarChar(10),
      filters.date
    );

    const result = await request.query<PunchHistoryRow>(
      GET_PUNCH_HISTORY_QUERY
    );

    return result.recordset.map((row: PunchHistoryRow) => {
      const dateTime = String(row.EventDateTime);

      return {
        punchId: Number(row.PunchId),

        employeeId: String(row.EmployeeId),

        employeeName: row.EmployeeName ?? "Unknown",

        dateTime,

        time: dateTime.substring(11, 19),

        readerId: Number(row.ReaderId),

        readerName: row.ReaderName ?? "Unknown",

        direction: row.Direction,

        eventId: Number(row.EventId),
      };
    });
  }
}

import sql from "mssql";

import { getBioStarDB } from "@/lib/database/biostar/db";

import { GET_EVENTS_QUERY } from "./queries/events-log.query";

import {
  EventHistoryFilters,
  EventHistoryItem,
} from "./events-log.types";

interface EventHistoryRow {
  EventLogId: number;
  EmployeeId: string | null;
  EmployeeName: string | null;
  EventDateTime: string;
  ReaderId: number;
  ReaderName: string | null;
  Direction: "IN" | "OUT" | "UNKNOWN";
  EventId: number;
  EventName: string | null;
  EventDescription: string | null;
}

export class EventsRepository {
  async getEvents(
    filters: EventHistoryFilters
  ): Promise<EventHistoryItem[]> {
    const pool = await getBioStarDB();

    const request = pool.request();

    request.input(
      "employeeId",
      sql.VarChar(64),
      filters.employeeId ?? null
    );

    request.input(
      "date",
      sql.VarChar(10),
      filters.date ?? null
    );

    request.input(
      "eventId",
      sql.Int,
      filters.eventId ?? null
    );

    const result = await request.query<EventHistoryRow>(
      GET_EVENTS_QUERY
    );

    return result.recordset.map((row) => {
      const dateTime = String(row.EventDateTime);

      return {
        eventLogId: Number(row.EventLogId),

        employeeId: String(row.EmployeeId ?? ""),

        employeeName:
          row.EmployeeName ?? "Unknown",

        dateTime,

        time: dateTime.substring(11, 19),

        readerId: Number(row.ReaderId),

        readerName:
          row.ReaderName ?? "Unknown",

        direction: row.Direction,

        eventId: Number(row.EventId),

        eventName:
          row.EventName ??
          `Unknown Event (${row.EventId})`,

        eventDescription:
          row.EventDescription ?? null,
      };
    });
  }
}

import { apiClient } from "./client";

export interface EventLogRecord {
  eventLogId: number;
  employeeId: string;
  employeeName: string;
  dateTime: string;
  time: string;
  readerId: number;
  readerName: string;
  direction: string;
  eventId: number;
  eventName: string;
  eventDescription: string;
}

export interface EventsLogResponse {
  success: boolean;
  data: EventLogRecord[];
  message?: string;
}

export interface EventsLogPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EventsLogParams {
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
   * Employee search (ID or name)
   */
  search?: string;

  /*
   * Direction filter
   * IN | OUT | UNKNOWN
   */
  direction?: string;

  /*
   * Reader filter
   * Example: "HR-In", "T1-Out", etc.
   */
  reader?: string;

  /*
   * Event ID filter
   */
  eventId?: number;

  /*
   * Reader ID filter (numeric)
   */
  readerId?: number;
}

/**
 * Get daily events log.
 *
 * Pagination and filtering are handled by the API.
 *
 * Example:
 *
 * page = 1, pageSize = 25
 * -> first 25 matching events
 *
 * page = 2, pageSize = 25
 * -> next 25 matching events
 */
export async function getEventsLog(
  params: EventsLogParams
): Promise<{
  success: boolean;
  data: EventLogRecord[];
  pagination: EventsLogPagination;
  message?: string;
}> {
  const searchParams = new URLSearchParams();

  /*
   * ----------------------------------------
   * Required date
   * ----------------------------------------
   */

  searchParams.set("date", params.date);

  /*
   * ----------------------------------------
   * Employee ID
   * ----------------------------------------
   */

  if (params.employeeId) {
    searchParams.set("employeeId", params.employeeId);
  }

  /*
   * ----------------------------------------
   * Pagination
   * ----------------------------------------
   */

  searchParams.set("page", String(params.page ?? 1));

  searchParams.set("pageSize", String(params.pageSize ?? 25));

  /*
   * ----------------------------------------
   * Employee search
   * ----------------------------------------
   */

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  /*
   * ----------------------------------------
   * Direction filter
   * ----------------------------------------
   */

  if (params.direction && params.direction !== "all") {
    searchParams.set("direction", params.direction);
  }

  /*
   * ----------------------------------------
   * Reader filter
   * ----------------------------------------
   */

  if (params.reader && params.reader !== "all") {
    searchParams.set("reader", params.reader);
  }

  /*
   * ----------------------------------------
   * Event ID filter
   * ----------------------------------------
   */

  if (params.eventId !== undefined) {
    searchParams.set("eventId", String(params.eventId));
  }

  /*
   * ----------------------------------------
   * Reader ID filter
   * ----------------------------------------
   */

  if (params.readerId !== undefined) {
    searchParams.set("readerId", String(params.readerId));
  }

  /*
   * ----------------------------------------
   * API request
   * ----------------------------------------
   *
   * Example:
   *
   * /api/v1/daily/events-log
   *   ?date=2026-09-05
   *   &page=1
   *   &pageSize=25
   *   &direction=IN
   *   &reader=HR-In
   *
   */

  return apiClient<{
    success: boolean;
    data: EventLogRecord[];
    pagination: EventsLogPagination;
    message?: string;
  }>(`/api/v1/daily/events-log?${searchParams.toString()}`);
}
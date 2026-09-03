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

interface EventsLogParams {
  employeeId?: string;
  date: string;
  eventId?: number;
}

export async function getEventsLog(
  params: EventsLogParams
): Promise<EventsLogResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("date", params.date);

  if (params.employeeId) {
    searchParams.set("employeeId", params.employeeId);
  }

  if (params.eventId !== undefined) {
    searchParams.set("eventId", String(params.eventId));
  }

  return apiClient<EventsLogResponse>(
    `/api/v1/daily/events-log?${searchParams.toString()}`
  );
}
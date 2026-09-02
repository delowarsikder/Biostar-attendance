import { apiClient } from "./client";

export interface EventItem {
  eventLogId: number;

  employeeId: string;
  employeeName: string;

  dateTime: string;
  time: string;

  readerId: number;
  readerName: string;

  direction: "IN" | "OUT" | "UNKNOWN";

  eventId: number;
  eventName: string;
  eventDescription: string;
}

export interface EventsResponse {
  success: boolean;

  data: {
    total: number;
    events: EventItem[];
  };
}

export interface EventFilters {
  employeeId?: string;
  date?: string;
  eventId?: number;
}

export async function getEvents(
  filters: EventFilters = {}
): Promise<EventsResponse> {
  const params = new URLSearchParams();

  if (filters.employeeId) {
    params.set("employeeId", filters.employeeId);
  }

  if (filters.date) {
    params.set("date", filters.date);
  }

  if (filters.eventId !== undefined) {
    params.set("eventId", String(filters.eventId));
  }

  const query = params.toString();

  return apiClient<EventsResponse>(
    `/api/v1/events${query ? `?${query}` : ""}`
  );
}
export type EventDirection = "IN" | "OUT" | "UNKNOWN";

export interface EventHistoryFilters {
  employeeId?: string;
  date?: string;
  eventId?: number;
  readerId?: number;
  search?: string;
  direction?: string;
  reader?: string;
}

export interface EventHistoryItem {
  eventLogId: number;

  employeeId: string;

  employeeName: string;

  dateTime: string;

  time: string;

  readerId: number;

  readerName: string;

  direction: EventDirection;

  eventId: number;

  eventName: string;

  eventDescription: string | null;
}

export interface EventHistoryResponse {
  total: number;

  events: EventHistoryItem[];
}
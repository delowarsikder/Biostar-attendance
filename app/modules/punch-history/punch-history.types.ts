export type PunchDirection = "IN" | "OUT" | "UNKNOWN";

export interface PunchHistoryItem {
  punchId: number;
  employeeId: string;
  employeeName: string;
  dateTime: string;
  time: string;
  readerId: number;
  readerName: string;
  direction: PunchDirection;
  eventId: number;
}

export interface PunchHistoryFilters {
  employeeId: string;
  date: string;
}

export interface PunchHistoryResponse {
  employee: {
    employeeId: string;
    employeeName: string;
  } | null;

  date: string;

  totalPunches: number;

  punches: PunchHistoryItem[];
}
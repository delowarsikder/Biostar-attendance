import { apiClient } from "./client";

export interface PunchHistoryItem {
  punchId: number;

  employeeId: string;
  employeeName: string;

  dateTime: string;
  time: string;

  readerId: number;
  readerName: string;

  direction: "IN" | "OUT" | "UNKNOWN";

  eventId: number;
}

export interface PunchHistoryResponse {
  success: boolean;

  data: {
    employee: {
      employeeId: string;
      employeeName: string;
    };

    date: string;

    totalPunches: number;

    punches: PunchHistoryItem[];
  };
}

export interface PunchHistoryFilters {
  employeeId: string;
  date: string;
}

export async function getPunchHistory(
  filters: PunchHistoryFilters
): Promise<PunchHistoryResponse> {
  const params = new URLSearchParams({
    employeeId: filters.employeeId,
    date: filters.date,
  });

  return apiClient<PunchHistoryResponse>(
    `/api/v1/punch-history?${params.toString()}`
  );
}
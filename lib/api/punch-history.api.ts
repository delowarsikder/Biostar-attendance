import { apiClient } from "./client";

export interface PunchHistoryRecord {
  punchId: number;
  employeeId: string;
  employeeName: string;
  dateTime: string;
  time: string;
  readerId: number;
  readerName: string;
  direction: string;
  eventId: number;
}

export interface PunchHistoryResponse {
  success: boolean;
  data: PunchHistoryRecord[];
  message?: string;
}

interface PunchHistoryParams {
  employeeId: string;
  date: string;
}

export async function getPunchHistory(
  params: PunchHistoryParams
): Promise<PunchHistoryResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("employeeId", params.employeeId);
  searchParams.set("date", params.date);

  return apiClient<PunchHistoryResponse>(
    `/api/v1/daily/punch-history?${searchParams.toString()}`
  );
}
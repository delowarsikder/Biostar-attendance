import { apiClient } from "./client";

export interface AttendanceItem {
  employeeId: string;
  employeeName: string;

  firstPunch: string | null;
  firstPunchReader: string | null;

  lastPunch: string | null;
  lastPunchReader: string | null;

  totalPunches: number;

  stayTime: string;

  status: string;
}

export interface AttendanceResponse {
  success: boolean;

  data: {
    total: number;
    attendance: AttendanceItem[];
  };
}

export interface AttendanceFilters {
  date?: string;
  employeeId?: string;
}

export async function getAttendance(
  filters: AttendanceFilters = {}
): Promise<AttendanceResponse> {
  const params = new URLSearchParams();

  if (filters.date) {
    params.set("date", filters.date);
  }

  if (filters.employeeId) {
    params.set("employeeId", filters.employeeId);
  }

  const query = params.toString();

  return apiClient<AttendanceResponse>(
    `/api/v1/attendance${query ? `?${query}` : ""}`
  );
}
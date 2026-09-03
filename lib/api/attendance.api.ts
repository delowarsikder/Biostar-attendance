import { apiClient } from "./client";

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  attendanceDate: string;
  firstPunch: string | null;
  firstPunchReader: string | null;
  lastPunch: string | null;
  lastPunchReader: string | null;
  totalPunches: number;
  stayTime: string;
  attendanceStatus: string;
}

export interface AttendanceResponse {
  success: boolean;
  data: AttendanceRecord[];
  message?: string;
}

interface AttendanceParams {
  date: string;
  employeeId?: string;
}

export async function getAttendance(
  params: AttendanceParams
): Promise<AttendanceResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("date", params.date);

  if (params.employeeId) {
    searchParams.set("employeeId", params.employeeId);
  }

  return apiClient<AttendanceResponse>(
    `/api/v1/daily/attendance?${searchParams.toString()}`
  );
}
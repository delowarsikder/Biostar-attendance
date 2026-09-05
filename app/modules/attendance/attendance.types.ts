export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;

  departmentId: number | null;
  departmentName: string | null;

  attendanceDate: string;

  firstPunch: string;
  firstPunchReader: string;

  lastPunch: string;
  lastPunchReader: string;

  totalPunches: number;

  stayTime: string;

  hasAttendance: boolean;
  isPresent: boolean;
  isLate: boolean;
  isEarlyOut: boolean;

  attendanceStatus: string;
}

export interface AttendanceSummary {
  totalEmployees: number;
  present: number;
  noAttendance: number;
  late: number;
  earlyOut: number;
}

export interface AttendancePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AttendanceResponse {
  success: boolean;

  data: AttendanceRecord[];

  summary: AttendanceSummary;

  pagination: AttendancePagination;
}

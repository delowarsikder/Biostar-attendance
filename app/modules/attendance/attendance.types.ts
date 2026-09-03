export interface AttendanceFilters {
  date?: string;
  employeeId?: string;
  search?: string;

  page: number;
  pageSize: number;
}

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

  attendanceStatus: string;
}

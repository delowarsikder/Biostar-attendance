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
  attendanceDate: string;

  firstPunch: string;
  firstPunchReader: string | null;

  lastPunch: string;
  lastPunchReader: string | null;

  totalPunches: number;

  stayTime: string;

  attendanceStatus: "Present";
}

export interface AttendanceResponse {
  data: AttendanceRecord[];

  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
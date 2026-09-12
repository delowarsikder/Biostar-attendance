export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  departmentId: number | null;
  departmentName: string | null;
  attendanceDate: string;
  firstPunch: string;
  firstPunchReader: string | number;
  lastPunch: string;
  lastPunchReader: string | number;
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
  data: AttendanceRecord[];
  summary: AttendanceSummary;
  pagination: AttendancePagination;
  departments: string[]; // <-- new
}

export interface AttendanceFilters {
  date?: string;
  employeeId?: string;
  search?: string;
  departmentId?: number;
  departmentName?: string;
  reader?: string;
  readerId?: number;
  status?: string;
  page: number;
  pageSize: number;
}
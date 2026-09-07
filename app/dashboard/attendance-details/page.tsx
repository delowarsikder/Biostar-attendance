"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClockAlert,
  Download,
  Filter,
  RefreshCw,
  Search,
  UserX,
  Users,
  X,
} from "lucide-react";

import DashboardShell from "@/components/dashboard-v1/layout/dashboard-shell";

import {
  AttendanceRecord,
  AttendanceSummary,
  AttendancePagination,
  getAttendance,
  getAttendanceForExport,
  AttendanceExportParams,
} from "@/lib/api/attendance.api";

import { exportToExcel, exportToPDF } from "@/lib/utils/export";

import { ATTENDANCE_READERS } from "@/app/modules/attendance/attendance.constants";

/*
 * ========================================
 * Today
 * ========================================
 */

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/*
 * ========================================
 * Format Punch
 * ========================================
 */

function formatPunch(value: string | null) {
  if (!value) return "—";
  return value.length >= 19 ? value.substring(11, 19) : value;
}

/*
 * ========================================
 * Get Reader Name
 * ========================================
 */

function getReaderName(
  readerMap: Map<number, string>,
  readerId: unknown
) {
  if (readerId === null || readerId === undefined || readerId === "") {
    return "—";
  }
  const id = Number(readerId);
  if (Number.isNaN(id)) {
    return String(readerId);
  }
  return readerMap.get(id) || "—";
}

/*
 * ========================================
 * Attendance Details Page
 * ========================================
 */

export default function AttendanceDetailsPage() {
  // Filters
  const [date, setDate] = useState(getToday);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [readerFilter, setReaderFilter] = useState<number | "all">("all");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // API data
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const [summary, setSummary] = useState<AttendanceSummary>({
    totalEmployees: 0,
    present: 0,
    noAttendance: 0,
    late: 0,
    earlyOut: 0,
  });

  const [pagination, setPagination] = useState<AttendancePagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });

  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * ========================================
   * Reader Map
   * ========================================
   */

  const readerMap = useMemo(() => {
    const map = new Map<number, string>();
    ATTENDANCE_READERS.forEach((reader) => {
      map.set(Number(reader.id), `${reader.name} [${reader.ip}]`);
    });
    return map;
  }, []);

  /*
   * ----------------------------------------
   * Load attendance
   * ----------------------------------------
   */

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);

      if (process.env.NODE_ENV === "development") {
        console.log("📤 Fetching attendance with:", {
          date,
          page,
          pageSize,
          search,
          departmentFilter,
          statusFilter,
          readerFilter,
        });
      }

      const response = await getAttendance({
        date,
        page,
        pageSize,
        search: search.trim() || undefined,
        departmentId:
          departmentFilter === "all" ? undefined : Number(departmentFilter),
        status:
          statusFilter === "all" ? undefined : statusFilter,
        readerId:
          readerFilter === "all" ? undefined : readerFilter,
      });

      if (process.env.NODE_ENV === "development") {
        console.log("📥 API response:", response);
      }

      if (!response.success) {
        throw new Error(response.message || "Unable to load attendance data.");
      }

      setRecords(response.data ?? []);
      setDepartmentOptions(response.departments ?? []);
      setSummary(
        response.summary ?? {
          totalEmployees: 0,
          present: 0,
          noAttendance: 0,
          late: 0,
          earlyOut: 0,
        }
      );
      setPagination(
        response.pagination ?? {
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load attendance data.";
      setError(message);
      setRecords([]);
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Attendance load error:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, page, search, departmentFilter, statusFilter, readerFilter]);

  /*
   * ----------------------------------------
   * Fetch whenever date/page changes
   * ----------------------------------------
   */

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  /*
   * ========================================
   * Summary
   * ========================================
   */

  const totalEmployees = summary.totalEmployees;
  const presentCount = summary.present;
  const absentCount = summary.noAttendance;
  const lateCount = summary.late;
  const earlyOutCount = summary.earlyOut;

  const now = new Date();

  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const dateForFilename = now.toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `attendance_${dateForFilename}_${time}.pdf`;
  /*
   * ========================================
   * Active filters
   * ========================================
   */

  const hasActiveFilters =
    search.trim() !== "" ||
    departmentFilter !== "all" ||
    statusFilter !== "all" ||
    readerFilter !== "all";

  /*
   * ========================================
   * Clear filters
   * ========================================
   */

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setReaderFilter("all");
    setPage(1);
  };

  /*
   * ========================================
   * Date change
   * ========================================
   */

  const handleDateChange = (value: string) => {
    setDate(value);
    setPage(1);
  };

  /*
   * ========================================
   * Refresh
   * ========================================
   */

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAttendance();
  };

  /*
   * ========================================
   * Page change
   * ========================================
   */

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1) return;
    if (pagination.totalPages > 0 && nextPage > pagination.totalPages) return;
    setPage(nextPage);
  };

  /*
   * ========================================
   * Export handlers
   * ========================================
   */

  const handleExportExcel = async () => {
    try {
      const exportParams: AttendanceExportParams = {
        date,
        search: search.trim() || undefined,
        departmentId:
          departmentFilter === "all" ? undefined : Number(departmentFilter),
      };

      const response = await getAttendanceForExport(exportParams);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to export attendance data."
        );
      }

      const columns = [
        { header: "SL No.", key: "serialNumber", width: 8 },
        { header: "ID", key: "employeeId", width: 15 },
        { header: "Employee", key: "employeeName", width: 25 },
        { header: "Department", key: "departmentName", width: 20 },
        { header: "First Punch", key: "firstPunch", width: 18 },
        { header: "Last Punch", key: "lastPunch", width: 18 },
        { header: "Stay Time", key: "stayTime", width: 14 },
        { header: "Status", key: "attendanceStatus", width: 18 },
      ];

      const exportData = response.data.map((record, index) => ({
        serialNumber: index + 1,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        departmentName: record.departmentName ?? "—",
        firstPunch: record.firstPunch ?? "—",
        lastPunch: record.lastPunch ?? "—",
        stayTime: record.stayTime ?? "00:00:00",
        attendanceStatus: record.attendanceStatus,
      }));

      exportToExcel({
        filename: filename,
        sheetName: "Attendance",
        columns,
        data: exportData,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to export Excel.";
      setError(message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportParams: AttendanceExportParams = {
        date,
        search: search.trim() || undefined,
        departmentId:
          departmentFilter === "all" ? undefined : Number(departmentFilter),
      };

      const response = await getAttendanceForExport(exportParams);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to export attendance data."
        );
      }

      const columns = [
        { header: "SL No.", key: "serialNumber", width: 15 },
        { header: "ID", key: "employeeId", width: 30 },
        { header: "Employee", key: "employeeName", width: 45 },
        { header: "Department", key: "departmentName", width: 35 },
        { header: "First Punch", key: "firstPunch", width: 35 },
        { header: "Last Punch", key: "lastPunch", width: 35 },
        { header: "Stay Time", key: "stayTime", width: 25 },
        { header: "Status", key: "attendanceStatus", width: 25 },
      ];

      const exportData = response.data.map((record, index) => ({
        serialNumber: index + 1,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        departmentName: record.departmentName ?? "—",
        firstPunch: record.firstPunch ?? "—",
        lastPunch: record.lastPunch ?? "—",
        stayTime: record.stayTime ?? "00:00:00",
        attendanceStatus: record.attendanceStatus,
      }));

      exportToPDF({
        filename: filename,
        columns,
        data: exportData,
        title: "Daily Attendance Report",
        subtitle: `Date: ${date} | Total: ${response.total} employees`,
      });

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to export PDF.";
      setError(message);
    }
  };

  /*
   * ========================================
   * Render
   * ========================================
   */

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* ================================= */}
        {/* Page Header */}
        {/* ================================= */}

        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Attendance Details
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View daily employee attendance and punch information.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={loading || records.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={loading || records.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* ================================= */}
        {/* Filters */}
        {/* ================================= */}

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Filters
              </h2>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-4 p-2 lg:grid-cols-[1.1fr_1.4fr_1.2fr_1fr_1.4fr_auto] lg:items-end">
            {/* Date */}
            <div>
              <label
                htmlFor="attendance-date"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Attendance Date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="attendance-date"
                  type="date"
                  value={date}
                  onChange={(event) => handleDateChange(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Employee */}
            <div>
              <label
                htmlFor="employee-search"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Employee
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="employee-search"
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="ID or employee name..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Clear employee search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department-filter"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Department
              </label>
              <div className="relative">
                <select
                  id="department-filter"
                  value={departmentFilter}
                  onChange={(event) => {
                    setDepartmentFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >
                  <option value="all">All Departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <div className="relative">
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="no_attendance">No Attendance</option>
                  <option value="late">Late</option>
                  <option value="early_out">Early Out</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Reader */}
            <div>
              <label
                htmlFor="reader-filter"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Reader
              </label>
              <div className="relative">
                <select
                  id="reader-filter"
                  value={String(readerFilter)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setReaderFilter(value === "all" ? "all" : Number(value));
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >
                  <option value="all">All Readers</option>
                  {ATTENDANCE_READERS.map((reader) => (
                    <option key={reader.id} value={String(reader.id)}>
                      {reader.name} [{reader.ip}]
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Clear */}
            <div>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Result Count */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-2 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) * pagination.pageSize + 1}
                –
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {pagination.total}
              </span>{" "}
              employees
            </p>
          </div>
        </section>

        {/* ================================= */}
        {/* Summary */}
        {/* ================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Employees"
            value={totalEmployees}
            description="Employees in attendance data"
            icon={Users}
          />
          <SummaryCard
            title="Present"
            value={presentCount}
            description="Employees with valid punches"
            icon={CheckCircle2}
          />
          <SummaryCard
            title="No Attendance"
            value={absentCount}
            description="Employees without attendance"
            icon={UserX}
          />
          <SummaryCard
            title="Late"
            value={lateCount}
            description="Independent late flag"
            icon={ClockAlert}
          />
          <SummaryCard
            title="Early Out"
            value={earlyOutCount}
            description="Independent early-out flag"
            icon={Clock3}
          />
        </section>

        {/* ================================= */}
        {/* Error */}
        {/* ================================= */}

        {error && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <X className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Unable to load attendance
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ================================= */}
        {/* Attendance Table */}
        {/* ================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Daily Attendance
              </h2>
              <p className="text-xs text-slate-500">
                {records.length}{" "}
                {records.length === 1 ? "employee" : "employees"}
              </p>
            </div>
            <div className="text-xs text-slate-500">{date}</div>
          </div>

          {loading ? (
            <LoadingTable />
          ) : records.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                    <TableHeader>SL No.</TableHeader>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>Employee</TableHeader>
                    <TableHeader>Department</TableHeader>
                    <TableHeader>First Punch</TableHeader>
                    <TableHeader>First Punch Reader</TableHeader>
                    <TableHeader>Last Punch</TableHeader>
                    <TableHeader>Last Punch Reader</TableHeader>
                    <TableHeader>Punches</TableHeader>
                    <TableHeader>Stay Time</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((record, index) => (
                    <AttendanceRow
                      key={record.employeeId}
                      record={record}
                      serialNumber={
                        (pagination.page - 1) * pagination.pageSize + index + 1
                      }
                      readerMap={readerMap}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* Pagination */}
        {/* ================================= */}

        <AttendancePaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </DashboardShell>
  );
}

/*
 * ========================================
 * Table Header
 * ========================================
 */

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

/*
 * ========================================
 * Summary Card
 * ========================================
 */

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SummaryCard({ title, value, description, icon: Icon }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </div>
      </div>
    </div>
  );
}

/*
 * ========================================
 * Attendance Row
 * ========================================
 */

function AttendanceRow({
  record,
  serialNumber,
  readerMap,
}: {
  record: AttendanceRecord;
  serialNumber: number;
  readerMap: Map<number, string>;
}) {
  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
      <td className="whitespace-nowrap px-5 py-2">
        <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
          {serialNumber}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-2">
        <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
          {record.employeeId}
        </span>
      </td>
      <td className="px-5 py-2">
        <p className="whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
          {record.employeeName}
        </p>
      </td>
      <td className="px-5 py-2">
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
          {record.departmentName || "—"}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="whitespace-nowrap font-mono text-sm text-slate-700 dark:text-slate-300">
          {formatPunch(record.firstPunch)}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
          {getReaderName(readerMap, record.firstPunchReader)}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="whitespace-nowrap font-mono text-sm text-slate-700 dark:text-slate-300">
          {formatPunch(record.lastPunch)}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
          {getReaderName(readerMap, record.lastPunchReader)}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-slate-100 px-2 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {record.totalPunches}
        </span>
      </td>
      <td className="px-5 py-2">
        <span className="whitespace-nowrap font-mono text-sm text-slate-700 dark:text-slate-300">
          {record.stayTime || "00:00:00"}
        </span>
      </td>
      <td className="px-5 py-2">
        <div className="flex flex-wrap gap-1.5">
          {!record.hasAttendance ? (
            <span className="inline-flex whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
              No Attendance
            </span>
          ) : (
            <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Present
            </span>
          )}
          {record.isLate && (
            <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Late
            </span>
          )}
          {record.isEarlyOut && (
            <span className="inline-flex whitespace-nowrap rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
              Early Out
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

/*
 * ========================================
 * Pagination
 * ========================================
 */

function AttendancePaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: AttendancePagination;
  onPageChange: (page: number) => void;
}) {
  const { page, pageSize, total, totalPages } = pagination;

  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${pageNumber === page
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/*
 * ========================================
 * Loading
 * ========================================
 */

function LoadingTable() {
  return (
    <div className="p-2">
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="grid grid-cols-10 gap-4">
            {Array.from({ length: 10 }).map((_, cellIndex) => (
              <div
                key={cellIndex}
                className="h-10 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/*
 * ========================================
 * Empty State
 * ========================================
 */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
        {hasFilters ? "No matching employees" : "No employees found"}
      </h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        {hasFilters
          ? "Try changing your search or filter criteria."
          : "There are no employees matching the selected date and filters."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </button>
      )}
    </div>
  );
}
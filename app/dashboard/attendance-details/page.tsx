"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  Users,
  UserX,
  X,
} from "lucide-react";

import DashboardShell from "@/components/dashboard-v1/layout/dashboard-shell";
import {
  AttendanceRecord,
  getAttendance,
} from "@/lib/api/attendance.api";

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPunch(value: string | null) {
  if (!value) {
    return "—";
  }

  // API returns SQL datetime as a string.
  // Do not use new Date() here because that can introduce
  // browser timezone conversion.
  return value.length >= 19 ? value.substring(11, 19) : value;
}

function getStatusClasses(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "present") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  }

  if (normalized === "absent") {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400";
  }

  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

export default function AttendanceDetailsPage() {
  const [date, setDate] = useState(getToday);
  const [search, setSearch] = useState("");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    try {
      setError(null);

      const response = await getAttendance({
        date,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Unable to load attendance data."
        );
      }

      setRecords(response.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load attendance data.";

      setError(message);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    loadAttendance();
  }, [loadAttendance]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      return (
        record.employeeName.toLowerCase().includes(query) ||
        record.employeeId.toLowerCase().includes(query)
      );
    });
  }, [records, search]);

  const totalEmployees = records.length;

  const presentCount = records.filter(
    (record) =>
      String(record.attendanceStatus ?? "").toLowerCase() === "present"
  ).length;

  const absentCount = records.filter(
    (record) =>
      String(record.attendanceStatus ?? "").toLowerCase() === "absent"
  ).length;

  const totalPunches = records.reduce(
    (total, record) => total + Number(record.totalPunches || 0),
    0
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAttendance();
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page header */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Attendance Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View daily employee attendance and punch information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""
                }`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {/* Filters */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-4 md:grid-cols-2">
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
                  onChange={(event) => setDate(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Employee search */}
            <div>
              <label
                htmlFor="employee-search"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Search Employee
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="employee-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by employee ID or name..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            title="Absent"
            value={absentCount}
            description="No valid attendance punch"
            icon={UserX}
          />

          <SummaryCard
            title="Total Punches"
            value={totalPunches}
            description="Valid attendance punches"
            icon={Clock3}
          />
        </section>

        {/* Error */}
        {error && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>

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

        {/* Attendance table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Daily Attendance
              </h2>

              <p className="text-xs text-slate-500">
                {search
                  ? `${filteredRecords.length} matching employee${filteredRecords.length === 1 ? "" : "s"
                  }`
                  : `${records.length} employee${records.length === 1 ? "" : "s"
                  }`}
              </p>
            </div>

            <div className="text-xs text-slate-500">
              {date}
            </div>
          </div>

          {loading ? (
            <LoadingTable />
          ) : filteredRecords.length === 0 ? (
            <EmptyState search={Boolean(search)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Employee
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      First Punch
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      First Punch Reader
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Last Punch
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Last Punch Reader
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Punches
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stay Time
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.map((record) => (
                    <AttendanceRow
                      key={record.employeeId}
                      record={record}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        </div>
      </div>
    </div>
  );
}

function AttendanceRow({
  record,
}: {
  record: AttendanceRecord;
}) {
  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {record.employeeName}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            ID: {record.employeeId}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {formatPunch(record.firstPunch)}
        </span>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
        {record.firstPunchReader || "—"}
      </td>

      <td className="px-5 py-4">
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {formatPunch(record.lastPunch)}
        </span>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
        {record.lastPunchReader || "—"}
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-slate-100 px-2 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {record.totalPunches}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {record.stayTime || "00:00:00"}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(record.attendanceStatus)}`}
        >
          {record.attendanceStatus || "Unknown"}
        </span>
      </td>
    </tr>
  );
}

function LoadingTable() {
  return (
    <div className="p-5">
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-8 gap-4"
          >
            {Array.from({ length: 8 }).map((__, cellIndex) => (
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

function EmptyState({ search }: { search: boolean }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        {search ? (
          <Search className="h-5 w-5 text-slate-400" />
        ) : (
          <CalendarDays className="h-5 w-5 text-slate-400" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
        {search
          ? "No employees found"
          : "No attendance records"}
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {search
          ? "Try a different employee ID or name."
          : "There are no attendance records for the selected date."}
      </p>
    </div>
  );
}
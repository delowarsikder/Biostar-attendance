"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

type AttendanceRecord = {
  employeeId: string;
  name: string;
  departmentId: number;
  departmentName: string | null;
  shiftId: number;
  shiftName: string;

  firstIn: number;
  lastOut: number;

  firstInFormatted: string;
  lastOutFormatted: string;

  presenceSeconds: number;
  presenceTime: string;

  workTimeSeconds: number;
  workTime: string;

  lateMinutes: number;
  earlyOutMinutes: number;

  status: string;

  nTAResult: number;
  nIsModify: number;
};

type Shift = {
  id: number;
  name: string;
  start: string;
  end: string;
};

type AttendanceResponse = {
  success: boolean;
  date: string;
  shift?: Shift;
  count: number;
  attendance: AttendanceRecord[];
  message?: string;
};

export default function Home() {
  const today = new Date();

  const localDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [date, setDate] = useState(localDate);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /*
   * Load attendance
   */

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/biostar/attendance/daily?date=${date}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load attendance");
        }

        const data: AttendanceResponse = await response.json();

        if (!data.success) {
          throw new Error(
            data.message || "Failed to load attendance"
          );
        }

        setAttendance(data.attendance || []);
        setShift(data.shift || null);
      } catch (err) {
        setAttendance([]);
        setShift(null);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [date, refreshKey]);

  /*
   * Summary
   */

  const presentCount = attendance.filter(
    (record) => record.firstIn > 0
  ).length;

  const noAttendanceCount = attendance.filter(
    (record) => record.firstIn === 0
  ).length;

  const lateCount = attendance.filter(
    (record) => record.lateMinutes > 0
  ).length;

  const earlyOutCount = attendance.filter(
    (record) => record.earlyOutMinutes > 0
  ).length;

  /*
   * Departments
   */

  const departments = useMemo(() => {
    const map = new Map<number, string>();

    attendance.forEach((record) => {
      if (
        record.departmentId !== null &&
        record.departmentId !== undefined
      ) {
        map.set(
          record.departmentId,
          record.departmentName || `Department ${record.departmentId}`
        );
      }
    });

    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1])
    );
  }, [attendance]);

  /*
   * Filter attendance
   */

  const filteredAttendance = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return attendance.filter((record) => {
      /*
       * Search
       */

      const matchesSearch =
        !searchValue ||
        record.employeeId
          .toLowerCase()
          .includes(searchValue) ||
        record.name
          .toLowerCase()
          .includes(searchValue);

      /*
       * Department
       */

      const matchesDepartment =
        department === "all" ||
        String(record.departmentId) === department;

      /*
       * Status
       */

      let matchesStatus = true;

      if (statusFilter === "present") {
        matchesStatus = record.firstIn > 0;
      }

      if (statusFilter === "no-attendance") {
        matchesStatus = record.firstIn === 0;
      }

      if (statusFilter === "late") {
        matchesStatus = record.lateMinutes > 0;
      }

      if (statusFilter === "early-out") {
        matchesStatus = record.earlyOutMinutes > 0;
      }

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [
    attendance,
    search,
    department,
    statusFilter,
  ]);

  /*
   * Reset filters
   */

  function resetFilters() {
    setSearch("");
    setDepartment("all");
    setStatusFilter("all");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div>
          <h1 className="text-3xl font-bold text-black">
            BioStar Attendance Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Daily employee attendance
          </p>
        </div>

        {/* Shift */}

        {shift && (
          <div className="mt-6 rounded-lg bg-white p-5 shadow">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Shift
                </p>

                <p className="text-lg font-bold text-black">
                  {shift.name}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Office Time
                </p>

                <p className="text-lg font-bold text-black">
                  {shift.start} — {shift.end}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Summary */}

        <div className="mt-6 grid gap-4 md:grid-cols-5">

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-600">
              Present
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {presentCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-600">
              No Attendance
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {noAttendanceCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-600">
              Late
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {lateCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-600">
              Early Out
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {earlyOutCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-bold text-gray-600">
              Total Employees
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {attendance.length}
            </p>
          </div>

        </div>

        {/* Attendance */}

        <div className="mt-6 rounded-lg bg-white p-6 shadow">

          {/* Header */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-semibold text-black">
                Daily Attendance
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Attendance for {date}
              </p>
            </div>

            {/* Date + Refresh */}

            <div className="flex items-center gap-2">

              <label
                htmlFor="attendance-date"
                className="text-sm font-medium text-black"
              >
                Date
              </label>

              <input
                id="attendance-date"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-gray-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setRefreshKey((value) => value + 1)
                }
                disabled={loading}
                title="Refresh attendance"
                aria-label="Refresh attendance"
                className="rounded-md bg-black p-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />
              </button>

            </div>

          </div>

          {/* Filters */}

          {!loading && !error && attendance.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-4">

              {/* Search */}

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search employee..."
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-black outline-none focus:border-gray-500"
                />

              </div>

              {/* Department */}

              <select
                value={department}
                onChange={(event) =>
                  setDepartment(event.target.value)
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-gray-500"
              >

                <option value="all">
                  All Departments
                </option>

                {departments.map(([id, name]) => (
                  <option
                    key={id}
                    value={String(id)}
                  >
                    {name}
                  </option>
                ))}


              </select>

              {/* Status */}

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-gray-500"
              >

                <option value="all">
                  All Status
                </option>

                <option value="present">
                  Present
                </option>

                <option value="no-attendance">
                  No Attendance
                </option>

                <option value="late">
                  Late
                </option>

                <option value="early-out">
                  Early Out
                </option>

              </select>

              {/* Reset */}

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
              >
                Reset Filters
              </button>

            </div>
          )}

          {/* Filter result */}

          {!loading && !error && attendance.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Showing{" "}
              <span className="font-bold text-black">
                {filteredAttendance.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-black">
                {attendance.length}
              </span>{" "}
              employees
            </div>
          )}

          {/* Loading */}

          {loading && (
            <div className="mt-6 rounded-md border p-6 text-center">
              <p className="text-black">
                Loading attendance...
              </p>
            </div>
          )}

          {/* Error */}

          {error && !loading && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Table */}

          {!loading && !error && (
            <div className="mt-6 overflow-x-auto">

              <table className="w-full border-collapse text-left text-sm text-black">

                <thead>

                  <tr className="border-b bg-gray-50">

                    <th className="px-4 py-3 font-bold">
                      Employee ID
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Name
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Department
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Status
                    </th>

                    <th className="px-4 py-3 font-bold">
                      First In
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Last Out
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Late
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Early Out
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Work Time
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredAttendance.length === 0 ? (

                    <tr>

                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center font-bold text-gray-600"
                      >
                        No employees match the selected filters.
                      </td>

                    </tr>

                  ) : (

                    filteredAttendance.map((record) => (

                      <tr
                        key={`${record.employeeId}-${date}`}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >

                        <td className="px-4 py-3 font-bold">
                          {record.employeeId}
                        </td>

                        <td className="px-4 py-3 font-bold">
                          {record.name}
                        </td>

                        <td className="px-4 py-3">
                          {record.departmentName || "—"}
                        </td>

                        <td className="px-4 py-3 font-bold">
                          {record.status}
                        </td>

                        <td className="px-4 py-3">
                          {record.firstInFormatted}
                        </td>

                        <td className="px-4 py-3">
                          {record.lastOutFormatted}
                        </td>

                        <td className="px-4 py-3">
                          {record.lateMinutes > 0
                            ? `${record.lateMinutes} min`
                            : "—"}
                        </td>

                        <td className="px-4 py-3">
                          {record.earlyOutMinutes > 0
                            ? `${record.earlyOutMinutes} min`
                            : "—"}
                        </td>

                        <td className="px-4 py-3">
                          {record.workTime}
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";


type AttendanceRecord = {
  nDateTime: number;
  nUserIdn: number;
  sUserName: string;
  sUserID: string;
  nDepartmentIdn: number;
  nShiftIdn: number;
  nDailyScheduleIdn: number;
  nStartTime: number;
  nEndTime: number;
  sStartEvent: string;
  sEndEvent: string;
  nTAResult: number;
  nWorkTime: number;
  nIsModify: number;
  nLateInTime: number;
  nEarlyOutTime: number;
};

type AttendanceResponse = {
  success: boolean;
  date: string;
  count: number;
  attendance: AttendanceRecord[];
  message?: string;
};

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}`;
}

export default function Home() {

  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [date, setDate] = useState(localDate);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/biostar/attendance/daily?date=${date}`
        );

        if (!response.ok) {
          throw new Error("Failed to load attendance");
        }

        const data: AttendanceResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load attendance");
        }

        setAttendance(data.attendance);
      } catch (err) {
        setAttendance([]);

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

  const presentCount = attendance.filter(
    (record) => record.nStartTime > 0
  ).length;

  const lateCount = attendance.filter(
    (record) => record.nLateInTime > 0
  ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black ">
            BioStar Attendance Dashboard
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-bold text-black">
              Present
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {presentCount}
            </p>
          </div>


          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-bold text-black">
              No Attendance
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {attendance.filter((record) => record.nStartTime === 0).length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-black ">
              Late
            </p>

            <p className="mt-2 text-3xl font-bold">
              {lateCount}
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-black ">
              Total Records
            </p>

            <p className="mt-2 text-3xl font-bold">
              {attendance.length}
            </p>
          </div>

        </div>

        {/* Attendance */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-semibold text-black ">
                Daily Attendance
              </h2>

              <p className="mt-1 text-sm text-black">
                Select a date to view attendance.
              </p>
            </div>

            <div>
              <label
                htmlFor="attendance-date"
                className="mr-3 text-sm font-medium text-black "
              >
                Date
              </label>

              <input
                id="attendance-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm  text-black shadow-sm focus:border-gray-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                disabled={loading}
                title="Refresh attendance"
                aria-label="Refresh attendance"
                className="rounded-md bg-black p-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
              </button>


            </div>

          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-6 rounded-md border p-6 text-center">
              <p className="text-black ">
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
                    <th className="px-4 py-3 font-bold text-black">
                      Employee ID
                    </th>

                    <th className="px-4 py-3 font-bold text-black">
                      Name
                    </th>
                    <th className="px-4 py-3 font-bold text-black">
                      Status
                    </th>

                    <th className="px-4 py-3 font-bold text-black">
                      First In
                    </th>

                    <th className="px-4 py-3 font-bold text-black">
                      Last Out
                    </th>

                    <th className="px-4 py-3 font-bold text-black">
                      Late
                    </th>

                    <th className="px-4 py-3 font-bold text-black">
                      Work Time
                    </th>
                  </tr>
                </thead>

                <tbody className="text-black">
                  {attendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center font-bold text-black"
                      >
                        No attendance found for {date}.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record) => (
                      <tr
                        key={`${record.nUserIdn}-${record.nDateTime}`}
                        className="border-b border-gray-200 text-black hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-bold text-black">
                          {record.sUserID}
                        </td>

                        <td className="px-4 py-3 font-bold text-black">
                          {record.sUserName}
                        </td>

                        <td className="px-4 py-3 font-bold">
                          {record.nStartTime > 0 ? "Present" : "No Attendance"}
                        </td>

                        <td className="px-4 py-3 font-bold text-black">
                          {formatMinutes(record.nStartTime)}
                        </td>

                        <td className="px-4 py-3 font-bold text-black">
                          {formatMinutes(record.nEndTime)}
                        </td>

                        <td className="px-4 py-3 font-bold text-black">
                          {record.nLateInTime > 0
                            ? `${record.nLateInTime} min`
                            : "—"}
                        </td>

                        <td className="px-4 py-3 font-bold text-black">
                          {record.nWorkTime > 0
                            ? formatMinutes(record.nWorkTime)
                            : "—"}
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

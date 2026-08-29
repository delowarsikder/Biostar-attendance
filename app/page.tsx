"use client";

import { useState } from "react";

export default function Home() {
  const [date, setDate] = useState("2026-08-29");
  const attendance = [
    {
      employeeId: "100050",
      name: "Employee 100050",
      firstIn: "07:15:36",
      lastOut: "—",
      status: "Present",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900">
          BioStar Attendance
        </h1>

        <p className="mt-1 text-gray-600">
          Attendance Dashboard
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Present</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Absent</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Late</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Employees</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Daily Attendance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a date to view attendance.
              </p>
            </div>

            <div>
              <label
                htmlFor="attendance-date"
                className="mr-3 text-sm font-medium text-gray-700"
              >
                Date
              </label>

              <input
                id="attendance-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* <div className="mt-6 rounded-md border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">
              Attendance for <strong>{date}</strong> will appear here.
            </p>
          </div> */}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Employee ID
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    First In
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Last Out
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((record) => (
                  <tr key={record.employeeId} className="border-b">
                    <td className="px-4 py-3">{record.employeeId}</td>
                    <td className="px-4 py-3">{record.name}</td>
                    <td className="px-4 py-3">{record.firstIn}</td>
                    <td className="px-4 py-3">{record.lastOut}</td>
                    <td className="px-4 py-3">{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
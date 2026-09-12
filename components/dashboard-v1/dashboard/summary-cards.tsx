"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck,
  Clock3,
  ClockAlert,
  Users,
} from "lucide-react";

import { getAttendance } from "@/lib/api/attendance.api";

import { ATTENDANCE_READERS } from "@/app/modules/attendance/attendance.constants";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface SummaryData {
  totalEmployees: number;
  present: number;
  noAttendance: number;
  late: number;
  earlyOut: number;
  totalPunches: number;
}

export default function SummaryCards() {
  const [data, setData] = useState<SummaryData>({
    totalEmployees: 0,
    present: 0,
    noAttendance: 0,
    late: 0,
    earlyOut: 0,
    totalPunches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await getAttendance({
          date: getToday(),
          page: 1,
          pageSize: 1,
        });

        if (response.success && response.summary) {
          setData({
            totalEmployees: response.summary.totalEmployees,
            present: response.summary.present,
            noAttendance: response.summary.noAttendance,
            late: response.summary.late,
            earlyOut: response.summary.earlyOut,
            totalPunches:
              response.summary.present +
              response.summary.late +
              response.summary.earlyOut,
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard summary:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  const cards = [
    {
      title: "Total Employees",
      value: loading ? "—" : data.totalEmployees.toString(),
      description: "Registered employees",
      icon: Users,
    },
    {
      title: "Present Today",
      value: loading ? "—" : data.present.toString(),
      description: "Employees with attendance",
      icon: CalendarCheck,
    },
    {
      title: "Absent Today",
      value: loading ? "—" : data.noAttendance.toString(),
      description: "No valid punch recorded",
      icon: Users,
    },
    {
      title: "Late Today",
      value: loading ? "—" : data.late.toString(),
      description: "Checked in after 09:00",
      icon: ClockAlert,
    },
    {
      title: "Early Out",
      value: loading ? "—" : data.earlyOut.toString(),
      description: "Left before shift end",
      icon: Clock3,
    },
    {
      title: "Total Punches",
      value: loading ? "—" : data.totalPunches.toString(),
      description: "Valid attendance punches",
      icon: Activity,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {card.value}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {card.description}
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
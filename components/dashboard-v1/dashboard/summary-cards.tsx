import {
  Activity,
  CalendarCheck,
  Clock3,
  Users,
} from "lucide-react";

const cards = [
  {
    title: "Total Employees",
    value: "—",
    description: "Registered employees",
    icon: Users,
  },
  {
    title: "Present Today",
    value: "—",
    description: "Employees with attendance",
    icon: CalendarCheck,
  },
  {
    title: "Absent Today",
    value: "—",
    description: "No valid punch recorded",
    icon: Users,
  },
  {
    title: "Total Punches",
    value: "—",
    description: "Valid attendance punches",
    icon: Activity,
  },
];

export default function SummaryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
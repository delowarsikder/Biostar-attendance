import Link from "next/link";
import {
  Activity,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";

const actions = [
  {
    title: "Attendance Details",
    description: "View daily employee attendance",
    href: "/dashboard/attendance-details",
    icon: CalendarCheck,
  },
  {
    title: "Punch History",
    description: "Review employee punch records",
    href: "/dashboard/punch-history",
    icon: ClipboardList,
  },
  {
    title: "Events Log",
    description: "Monitor BioStar system events",
    href: "/dashboard/events-log",
    icon: Activity,
  },
];

export default function QuickActions() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Quick Access
        </h2>
        <p className="text-sm text-slate-500">
          Access commonly used attendance features.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>

              <h3 className="font-semibold text-slate-900 group-hover:underline dark:text-white">
                {action.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
import DashboardShell from "@/components/dashboard-v1/layout/dashboard-shell";
import QuickActions from "@/components/dashboard-v1/dashboard/quick-actions";
import SummaryCards from "@/components/dashboard-v1/dashboard/summary-cards";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Page heading */}
        <section>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Overview of today&apos;s employee attendance.
            </p>
          </div>
        </section>

        {/* Summary */}
        <SummaryCards />

        {/* Quick actions */}
        <QuickActions />
      </div>
    </DashboardShell>
  );
}
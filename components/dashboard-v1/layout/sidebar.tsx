"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Settings,
  X,
} from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "ATTENDANCE",
    items: [
      {
        label: "Attendance Details",
        href: "/dashboard/attendance-details",
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: "MONITORING",
    items: [
      {
        label: "Punch History",
        href: "/dashboard/punch-history",
        icon: ClipboardList,
      },
      {
        label: "Events Log",
        href: "/dashboard/events-log",
        icon: Activity,
      },
    ],
  },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r border-slate-200 bg-white
          transition-all duration-300
          dark:border-slate-800 dark:bg-slate-950
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div
          className={`
            flex h-16 items-center border-b border-slate-200
            dark:border-slate-800
            ${collapsed ? "justify-center px-2" : "justify-between px-5"}
          `}
        >
          <Link
            href="/"
            onClick={onMobileClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                <Image
                  src="/logo/nwpgcl.png"
                  alt="NWPGCL Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              </div>

            </div>



            {!collapsed && (
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Khulna 225MW CCPP
                </div>
                <div className="text-[10px] font-medium tracking-wider text-slate-500">
                  ATTENDANCE
                </div>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <div className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-slate-400">
                  {section.title}
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center rounded-lg px-3 py-2.5
                        text-sm font-medium transition-colors
                        ${collapsed ? "justify-center" : "gap-3"}
                        ${isActive
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        }
                      `}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />

                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <button
            type="button"
            title={collapsed ? "Settings" : undefined}
            className={`
              flex w-full items-center rounded-lg px-3 py-2.5
              text-sm font-medium text-slate-600
              hover:bg-slate-100 hover:text-slate-900
              dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white
              ${collapsed ? "justify-center" : "gap-3"}
            `}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />

            {!collapsed && <span>Settings</span>}
          </button>

          {/* Collapse button - desktop */}
          <button
            type="button"
            onClick={onToggle}
            className="mt-2 hidden w-full items-center justify-center rounded-lg border border-slate-200 py-2 text-slate-500 hover:bg-slate-50 lg:flex dark:border-slate-800 dark:hover:bg-slate-900"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-2 text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
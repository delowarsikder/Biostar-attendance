"use client";

import { Menu, UserCircle } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
            Attendance Dashboard
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            BioStar attendance monitoring system
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Administrator
          </p>
          <p className="text-xs text-slate-500">System User</p>
        </div>

        <UserCircle className="h-8 w-8 text-slate-400" />
      </div>
    </header>
  );
}
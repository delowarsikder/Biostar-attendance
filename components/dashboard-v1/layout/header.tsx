"use client";

import {
  Menu,
  UserCircle,
  Sun,
  Moon,
} from "lucide-react";

import { useEffect, useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

type Theme = "light" | "dark";

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const [theme, setTheme] =
    useState<Theme>("light");

  /*
   * Load saved theme.
   *
   * If the user has never selected a theme,
   * use the operating system preference.
   */
  useEffect(() => {
    const savedTheme =
      localStorage.getItem(
        "biostar-theme"
      ) as Theme | null;

    if (
      savedTheme === "light" ||
      savedTheme === "dark"
    ) {
      setTheme(savedTheme);

      document.documentElement.classList.toggle(
        "dark",
        savedTheme === "dark"
      );

      document.documentElement.style.colorScheme =
        savedTheme;

      return;
    }

    const prefersDark =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    const initialTheme: Theme =
      prefersDark ? "dark" : "light";

    setTheme(initialTheme);

    document.documentElement.classList.toggle(
      "dark",
      prefersDark
    );

    document.documentElement.style.colorScheme =
      initialTheme;
  }, []);

  /*
   * Toggle between Light and Dark mode.
   */
  const toggleTheme = () => {
    const newTheme: Theme =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(newTheme);

    localStorage.setItem(
      "biostar-theme",
      newTheme
    );

    document.documentElement.classList.toggle(
      "dark",
      newTheme === "dark"
    );

    document.documentElement.style.colorScheme =
      newTheme;
  };

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-16 items-center
        justify-between
        border-b border-slate-200
        bg-white/95
        px-4
        backdrop-blur
        transition-colors
        sm:px-6
        dark:border-slate-800
        dark:bg-slate-950/95
      "
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="
            rounded-lg p-2
            text-slate-600
            transition-colors
            hover:bg-slate-100
            lg:hidden
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1
            className="
              text-sm font-semibold
              text-slate-900
              sm:text-base
              dark:text-white
            "
          >
            Attendance Dashboard
          </h1>

          <p
            className="
              hidden text-xs
              text-slate-500
              sm:block
              dark:text-slate-400
            "
          >
            BioStar attendance monitoring system
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="
            relative
            flex h-9 w-9
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            bg-white
            text-slate-600
            shadow-sm
            transition-all
            duration-200
            hover:bg-slate-100
            hover:text-slate-900
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
            dark:hover:text-white
          "
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* User information */}
        <div className="hidden text-right sm:block">
          <p
            className="
              text-sm font-medium
              text-slate-900
              dark:text-white
            "
          >
            Administrator
          </p>

          <p
            className="
              text-xs
              text-slate-500
              dark:text-slate-400
            "
          >
            System User
          </p>
        </div>

        {/* User icon */}
        <UserCircle
          className="
            h-8 w-8
            text-slate-400
            dark:text-slate-500
          "
        />
      </div>
    </header>
  );
}
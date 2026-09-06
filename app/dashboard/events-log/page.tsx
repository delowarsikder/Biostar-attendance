"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import DashboardShell from "@/components/dashboard-v1/layout/dashboard-shell";

import {
  EventLogRecord,
  EventsLogPagination,
  getEventsLog,
} from "@/lib/api/events-log.api";

import {
  ATTENDANCE_READERS,
} from "@/app/modules/attendance/attendance.constants";


/*
 * ========================================
 * Today
 * ========================================
 */

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/*
 * ========================================
 * Events Log Page
 * ========================================
 */

export default function EventsLogPage() {
  /*
   * ----------------------------------------
   * Filters
   * ----------------------------------------
   */

  const [date, setDate] =
    useState(getToday);

  const [search, setSearch] =
    useState("");

  const [
    directionFilter,
    setDirectionFilter,
  ] = useState("all");

  const [
    readerFilter,
    setReaderFilter,
  ] = useState<number | "all">("all");

  /*
   * ----------------------------------------
   * Pagination
   * ----------------------------------------
   */

  const [page, setPage] =
    useState(1);

  const pageSize = 25;

  /*
   * ----------------------------------------
   * API data
   * ----------------------------------------
   */

  const [records, setRecords] =
    useState<EventLogRecord[]>([]);

  const [pagination, setPagination] =
    useState<EventsLogPagination>({
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    });

  /*
   * ----------------------------------------
   * Loading / error
   * ----------------------------------------
   */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ----------------------------------------
   * Load events
   * ----------------------------------------
   */

  const loadEvents =
    useCallback(
      async () => {
        try {
          setError(null);

          const response =
            await getEventsLog({
              date,
              page,
              pageSize,
              search: search.trim() || undefined,
              direction:
                directionFilter === "all"
                  ? undefined
                  : directionFilter,
              readerId:
                readerFilter === "all"
                  ? undefined
                  : readerFilter,
            });

          if (!response.success) {
            throw new Error(
              response.message ||
              "Unable to load events log."
            );
          }

          /*
           * Current page records
           */

          setRecords(
            response.data ?? []
          );

          /*
           * Backend pagination
           */

          setPagination(
            response.pagination ?? {
              page: 1,
              pageSize: 25,
              total: 0,
              totalPages: 0,
            }
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load events log.";

          setError(message);
          setRecords([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        date,
        page,
        search,
        directionFilter,
        readerFilter,
      ]
    );

  /*
   * ----------------------------------------
   * Fetch whenever filters/page changes
   * ----------------------------------------
   */

  useEffect(() => {
    setLoading(true);

    loadEvents();
  }, [
    loadEvents,
  ]);

  /*
   * ========================================
   * Reader options
   *
   * IMPORTANT:
   *
   * DO NOT build this from `records`.
   *
   * `records` contains only the current
   * pagination page.
   *
   * Instead, use the complete fixed
   * ATTENDANCE_READERS list.
   *
   * Therefore all readers are always
   * available on every page.
   * ========================================
   */
  const readerOptions = useMemo(() => {
    return ATTENDANCE_READERS;
  }, []);

  /*
   * ========================================
   * Active filters
   * ========================================
   */

  const hasActiveFilters =
    search.trim() !== "" ||
    directionFilter !==
    "all" ||
    readerFilter !==
    "all";

  /*
   * ========================================
   * Clear filters
   * ========================================
   */

  const clearFilters = () => {
    setSearch("");

    setDirectionFilter(
      "all"
    );

    setReaderFilter(
      "all"
    );

    setPage(1);
  };

  /*
   * ========================================
   * Date change
   * ========================================
   */

  const handleDateChange = (
    value: string
  ) => {
    setDate(value);

    setPage(1);
  };

  /*
   * ========================================
   * Refresh
   * ========================================
   */

  const handleRefresh =
    async () => {
      setRefreshing(true);

      await loadEvents();
    };

  /*
   * ========================================
   * Page change
   * ========================================
   */

  const handlePageChange = (
    nextPage: number
  ) => {
    if (
      nextPage < 1
    ) {
      return;
    }

    if (
      pagination.totalPages >
      0 &&
      nextPage >
      pagination.totalPages
    ) {
      return;
    }

    setPage(nextPage);
  };

  /*
   * ========================================
   * Render
   * ========================================
   */

  return (
    <DashboardShell>
      <div className="space-y-6">

        {/* ================================= */}
        {/* Page Header */}
        {/* ================================= */}

        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Events Log
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View daily employee punch events and reader activity.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              loading ||
              refreshing
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing
                ? "animate-spin"
                : ""
                }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </section>

        {/* ================================= */}
        {/* Filters */}
        {/* ================================= */}

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />

              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Filters
              </h2>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />

                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-4 p-2 lg:grid-cols-[1.1fr_1.2fr_1fr_1.4fr_auto] lg:items-end">

            {/* ================================= */}
            {/* Date */}
            {/* ================================= */}

            <div>
              <label
                htmlFor="events-date"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Date
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="events-date"
                  type="date"
                  value={date}
                  onChange={(
                    event
                  ) =>
                    handleDateChange(
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />
              </div>
            </div>

            {/* ================================= */}
            {/* Employee Search */}
            {/* ================================= */}

            <div>
              <label
                htmlFor="employee-search"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Employee
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="employee-search"
                  type="text"
                  value={search}
                  onChange={(
                    event
                  ) => {
                    setSearch(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="ID or employee name..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch(
                        ""
                      );

                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Clear employee search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ================================= */}
            {/* Direction */}
            {/* ================================= */}

            <div>
              <label
                htmlFor="direction-filter"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Direction
              </label>

              <div className="relative">
                <select
                  id="direction-filter"
                  value={
                    directionFilter
                  }
                  onChange={(
                    event
                  ) => {
                    setDirectionFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >
                  <option value="all">
                    All Directions
                  </option>

                  <option value="IN">
                    IN
                  </option>

                  <option value="OUT">
                    OUT
                  </option>

                  <option value="UNKNOWN">
                    Unknown
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* ================================= */}
            {/* Reader */}
            {/* ================================= */}

            <div>
              <label
                htmlFor="reader-filter"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Reader
              </label>

              <div className="relative">
                <select
                  id="reader-filter"
                  value={String(readerFilter)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setReaderFilter(value === "all" ? "all" : Number(value));
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >
                  <option value="all">
                    All Readers
                  </option>

                  {readerOptions.map((reader) => (
                    <option
                      key={reader.id}
                      value={String(reader.id)}
                    >
                      {reader.name} [{reader.ip}]
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>


            {/* ================================= */}
            {/* Clear */}
            {/* ================================= */}

            <div>
              <button
                type="button"
                onClick={
                  clearFilters
                }
                disabled={
                  !hasActiveFilters
                }
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />

                Clear
              </button>
            </div>

          </div>

          {/* ================================= */}
          {/* Result Count */}
          {/* ================================= */}

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-2 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {pagination.total ===
                  0
                  ? 0
                  : (
                    (
                      pagination.page -
                      1
                    ) *
                    pagination.pageSize
                  ) + 1}
                –
                {Math.min(
                  pagination.page *
                  pagination.pageSize,
                  pagination.total
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {
                  pagination.total
                }
              </span>{" "}
              events
            </p>
          </div>
        </section>

        {/* ================================= */}
        {/* Error */}
        {/* ================================= */}

        {error && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">

              <X className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />

              <div>
                <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Unable to load events log
                </h2>

                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {
                    error
                  }
                </p>
              </div>

            </div>
          </section>
        )}

        {/* ================================= */}
        {/* Events Table */}
        {/* ================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">

          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Events Log
              </h2>

              <p className="text-xs text-slate-500">
                {records.length}{" "}
                {records.length ===
                  1
                  ? "event"
                  : "events"}
              </p>
            </div>

            <div className="text-xs text-slate-500">
              {date}
            </div>

          </div>

          {loading ? (
            <LoadingTable />
          ) : records.length ===
            0 ? (
            <EmptyState
              hasFilters={
                hasActiveFilters
              }
              onClear={
                clearFilters
              }
            />
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px] text-left">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">

                    <TableHeader>
                      SL No.
                    </TableHeader>

                    <TableHeader>
                      Time
                    </TableHeader>

                    <TableHeader>
                      Employee ID
                    </TableHeader>

                    <TableHeader>
                      Employee Name
                    </TableHeader>

                    <TableHeader>
                      Reader
                    </TableHeader>

                    <TableHeader>
                      Reader IP
                    </TableHeader>

                    <TableHeader>
                      Direction
                    </TableHeader>

                    <TableHeader>
                      Event ID
                    </TableHeader>

                    <TableHeader>
                      Event Name
                    </TableHeader>

                    <TableHeader>
                      Description
                    </TableHeader>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                  {records.map(
                    (
                      record,
                      index
                    ) => (
                      <EventRow
                        key={
                          record.eventLogId
                        }
                        record={
                          record
                        }
                        serialNumber={
                          (
                            (
                              pagination.page -
                              1
                            ) *
                            pagination.pageSize
                          ) +
                          index +
                          1
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ================================= */}
        {/* Pagination */}
        {/* ================================= */}

        <EventsPaginationControls
          pagination={
            pagination
          }
          onPageChange={
            handlePageChange
          }
        />

      </div>
    </DashboardShell>
  );
}


/*
 * ========================================
 * Table Header
 * ========================================
 */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {
        children
      }
    </th>
  );
}


/*
 * ========================================
 * Event Row
 * ========================================
 */

function EventRow({
  record,
  serialNumber,
}: {
  record: EventLogRecord;
  serialNumber: number;
}) {
  const directionColor =
    record.direction === "IN"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : record.direction === "OUT"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">

      {/* Serial */}
      <td className="whitespace-nowrap px-5 py-2">
        <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
          {
            serialNumber
          }
        </span>
      </td>

      {/* Time */}
      <td className="whitespace-nowrap px-5 py-2">
        <span className="whitespace-nowrap font-mono text-sm text-slate-700 dark:text-slate-300">
          {record.time}
        </span>
      </td>

      {/* Employee ID */}
      <td className="whitespace-nowrap px-5 py-2">
        <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
          {record.employeeId}
        </span>
      </td>

      {/* Employee Name */}
      <td className="px-5 py-2">
        <p className="whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
          {record.employeeName}
        </p>
      </td>

      {/* Reader Name */}
      <td className="px-5 py-2">
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
          {record.readerName}
        </span>
      </td>

      {/* Reader IP - find from constants */}
      <td className="px-5 py-2">
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-mono">
          {(() => {
            const r = ATTENDANCE_READERS.find(
              (x) => x.id === record.readerId
            );
            return r ? r.ip : "—";
          })()}
        </span>
      </td>

      {/* Direction */}
      <td className="px-5 py-2">
        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${directionColor}`}>
          {record.direction}
        </span>
      </td>

      {/* Event ID */}
      <td className="whitespace-nowrap px-5 py-2">
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
          {record.eventId}
        </span>
      </td>

      {/* Event Name */}
      <td className="px-5 py-2">
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
          {record.eventName}
        </span>
      </td>

      {/* Description */}
      <td className="px-5 py-2">
        <span className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-500">
          {record.eventDescription || "—"}
        </span>
      </td>

    </tr>
  );
}


/*
 * ========================================
 * Pagination
 * ========================================
 */

function EventsPaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: EventsLogPagination;
  onPageChange: (
    page: number
  ) => void;
}) {
  const {
    page,
    pageSize,
    total,
    totalPages,
  } = pagination;

  if (total === 0) {
    return null;
  }

  const start =
    (
      page - 1
    ) *
    pageSize +
    1;

  const end =
    Math.min(
      page *
      pageSize,
      total
    );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">

      {/* Result */}

      <div className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {
            start
          }
          –
          {
            end
          }
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {
            total
          }
        </span>
      </div>

      {/* Controls */}

      <div className="flex items-center gap-1">

        {/* Previous */}

        <button
          type="button"
          disabled={
            page <= 1
          }
          onClick={() =>
            onPageChange(
              page - 1
            )
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Previous
        </button>

        {/* Page Numbers */}

        {Array.from(
          {
            length:
              totalPages,
          },
          (
            _,
            index
          ) =>
            index + 1
        ).map(
          (
            pageNumber
          ) => (
            <button
              key={
                pageNumber
              }
              type="button"
              onClick={() =>
                onPageChange(
                  pageNumber
                )
              }
              className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${pageNumber ===
                page
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
            >
              {
                pageNumber
              }
            </button>
          )
        )}

        {/* Next */}

        <button
          type="button"
          disabled={
            page >=
            totalPages
          }
          onClick={() =>
            onPageChange(
              page + 1
            )
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Next
        </button>

      </div>
    </div>
  );
}


/*
 * ========================================
 * Loading
 * ========================================
 */

function LoadingTable() {
  return (
    <div className="p-2">
      <div className="space-y-4">

        {Array.from({
          length: 7,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={
                index
              }
              className="grid grid-cols-9 gap-4"
            >
              {Array.from({
                length: 9,
              }).map(
                (
                  __,
                  cellIndex
                ) => (
                  <div
                    key={
                      cellIndex
                    }
                    className="h-10 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
                  />
                )
              )}
            </div>
          )
        )}

      </div>
    </div>
  );
}


/*
 * ========================================
 * Empty State
 * ========================================
 */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Search className="h-5 w-5 text-slate-400" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
        {
          hasFilters
            ? "No matching events"
            : "No events found"
        }
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {
          hasFilters
            ? "Try changing your search or filter criteria."
            : "There are no events for the selected date and filters."
        }
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={
            onClear
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <X className="h-3.5 w-3.5" />

          Clear filters
        </button>
      )}

    </div>
  );
}
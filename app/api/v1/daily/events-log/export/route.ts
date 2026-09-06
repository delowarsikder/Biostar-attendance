import { NextRequest, NextResponse } from "next/server";

import { EventsRepository } from "@/app/modules/events-log/events-log.repository";

import {
  EventHistoryFilters,
  EventHistoryItem,
} from "@/app/modules/events-log/events-log.types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const date =
      searchParams.get("date") || undefined;

    const employeeId =
      searchParams.get("employeeId")?.trim() || undefined;

    const search =
      searchParams.get("search")?.trim() || undefined;

    const direction =
      searchParams.get("direction")?.trim() || undefined;

    const reader =
      searchParams.get("reader")?.trim() || undefined;

    const eventIdValue =
      searchParams.get("eventId");

    const eventId =
      eventIdValue !== null
        ? Number(eventIdValue)
        : undefined;

    const readerIdValue =
      searchParams.get("readerId");

    const readerId =
      readerIdValue !== null
        ? Number(readerIdValue)
        : undefined;

    if (date && !isValidDate(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Expected YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    if (
      eventId !== undefined &&
      (!Number.isInteger(eventId) || eventId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "eventId must be a positive integer",
        },
        { status: 400 }
      );
    }

    if (
      readerId !== undefined &&
      (!Number.isInteger(readerId) || readerId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "readerId must be a positive integer",
        },
        { status: 400 }
      );
    }

    if (
      direction !== undefined &&
      direction !== "all" &&
      !["IN", "OUT", "UNKNOWN"].includes(direction)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "direction must be IN, OUT, or UNKNOWN",
        },
        { status: 400 }
      );
    }

    const repository = new EventsRepository();

    const filters: EventHistoryFilters = {
      employeeId,
      date,
      search,
      direction: direction === "all" ? undefined : direction,
      reader: reader === "all" ? undefined : reader,
      eventId,
      readerId,
    };

    const events = await repository.getEvents(filters);

    return NextResponse.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (error) {
    console.error("Events export API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve events for export.",
      },
      { status: 500 }
    );
  }
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
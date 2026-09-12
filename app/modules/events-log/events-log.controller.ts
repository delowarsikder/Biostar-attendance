import { NextRequest, NextResponse } from "next/server";

import { EventsService } from "./events-log.service";

export class EventsController {
  private service: EventsService;

  constructor() {
    this.service = new EventsService();
  }

  async getEvents(req: NextRequest) {
    try {
      const searchParams = req.nextUrl.searchParams;

      const employeeId =
        searchParams.get("employeeId")?.trim() || undefined;

      const date =
        searchParams.get("date")?.trim() || undefined;

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

      const pageValue =
        searchParams.get("page");

      const page =
        pageValue !== null
          ? Number(pageValue)
          : 1;

      const pageSizeValue =
        searchParams.get("pageSize");

      const pageSize =
        pageSizeValue !== null
          ? Number(pageSizeValue)
          : 25;

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
        page !== undefined &&
        (!Number.isInteger(page) || page < 1)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "page must be a positive integer",
          },
          { status: 400 }
        );
      }

      if (
        pageSize !== undefined &&
        (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "pageSize must be between 1 and 100",
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

      const data = await this.service.getEvents({
        employeeId,
        date,
        search,
        direction,
        reader,
        eventId,
        readerId,
        page,
        pageSize,
      });

      return NextResponse.json({
        success: true,
        data: data.events,
        pagination: {
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        },
      });
    } catch (error) {
      console.error("Events API error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to retrieve events",
        },
        { status: 500 }
      );
    }
  }
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
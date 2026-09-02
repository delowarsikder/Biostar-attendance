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

      const eventIdValue =
        searchParams.get("eventId");

      const eventId =
        eventIdValue !== null
          ? Number(eventIdValue)
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

      const data = await this.service.getEvents({
        employeeId,
        date,
        eventId,
      });

      return NextResponse.json({
        success: true,
        data,
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

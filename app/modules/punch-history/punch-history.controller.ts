import { NextRequest, NextResponse } from "next/server";

import { PunchHistoryService } from "./punch-history.service";

export class PunchHistoryController {
  private service: PunchHistoryService;

  constructor() {
    this.service = new PunchHistoryService();
  }

  async getPunchHistory(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);

      const employeeId =
        searchParams.get("employeeId")?.trim();

      const date =
        searchParams.get("date")?.trim();

      if (!employeeId) {
        return NextResponse.json(
          {
            success: false,
            message: "employeeId is required",
          },
          {
            status: 400,
          }
        );
      }

      if (!date) {
        return NextResponse.json(
          {
            success: false,
            message: "date is required",
          },
          {
            status: 400,
          }
        );
      }

      if (!isValidDate(date)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid date format. Expected YYYY-MM-DD",
          },
          {
            status: 400,
          }
        );
      }

      const data =
        await this.service.getPunchHistory({
          employeeId,
          date,
        });

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(
        "Punch history API error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to retrieve punch history",
        },
        {
          status: 500,
        }
      );
    }
  }
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
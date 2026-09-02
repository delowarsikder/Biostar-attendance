

import { NextRequest } from "next/server";

import { EventsController } from "@/app/modules/events-log/events-log.controller";

const controller = new EventsController();

export async function GET(req: NextRequest) {
  return controller.getEvents(req);
}

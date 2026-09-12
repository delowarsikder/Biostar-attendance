import { NextRequest } from "next/server";

import { PunchHistoryController } from "@/app/modules/punch-history/punch-history.controller";

const controller = new PunchHistoryController();

export async function GET(request: NextRequest) {
  return controller.getPunchHistory(request);
}
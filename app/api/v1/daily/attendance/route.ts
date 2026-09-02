import { NextRequest } from "next/server";

import { getAttendance } from "@/app/modules/attendance/attendance.controller";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  return getAttendance(request);
}
import { NextResponse } from "next/server";
import { getBioStarDB } from "@/lib/database/biostar/db";

export async function GET() {
  try {
    const pool = await getBioStarDB();

    const result = await pool
      .request()
      .query("SELECT GETDATE() AS serverTime");

    return NextResponse.json({
      success: true,
      message: "BioStar database connected successfully",
      serverTime: result.recordset[0].serverTime,
    });
  } catch (error) {
    console.error("BioStar DB connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to BioStar database",
      },
      { status: 500 }
    );
  }
}

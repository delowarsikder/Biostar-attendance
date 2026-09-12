import { NextResponse } from "next/server";
import { getBioStarDB } from "@/lib/database/biostar/db";

export async function GET() {
  try {
    const pool = await getBioStarDB();

    const result = await pool.request().query(`
      SELECT
        nUserIdn,
        sUserName,
        nDepartmentIdn,
        sUserID,
        nStartDate,
        nEndDate,
        nAdminLevel,
        nAuthMode
      FROM TB_USER
      ORDER BY sUserName
    `);

    return NextResponse.json({
      success: true,
      count: result.recordset.length,
      users: result.recordset,
    });
  } catch (error) {
    console.error("BioStar users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve BioStar users",
      },
      { status: 500 }
    );
  }
}
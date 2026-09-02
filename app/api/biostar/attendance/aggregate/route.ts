import { NextRequest, NextResponse } from "next/server";
import { getBioStarDB } from "@/lib/biostar/db";

export async function GET(request: NextRequest) {
    try {
        // Get date from query string (?date=2026-08-31)
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");

        if (!date) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Date is required",
                },
                { status: 400 }
            );
        }

        const pool = await getBioStarDB();

        const result = await pool
            .request()
            .input("date", date)
            .query(`
                SELECT
                    el.nEventLogIdn,

                    DATEADD(
                        SECOND,
                        el.nDateTime,
                        '1970-01-01'
                    ) AS punchDateTime,

                    el.nReaderIdn,
                    r.sName AS readerName,

                    el.nEventIdn,
                    el.nUserID,
                    el.nIsLog,
                    el.nTNAEvent,
                    el.nIsUseTA,
                    el.nType

                FROM TB_EVENT_LOG el

                LEFT JOIN TB_READER r
                    ON r.nReaderIdn = el.nReaderIdn

                WHERE el.nEventIdn = 55
                AND el.nIsUseTA = 1

                AND el.nDateTime >= DATEDIFF(
                    SECOND,
                    '1970-01-01',
                    CONVERT(date, @date)
                )

                AND el.nDateTime < DATEDIFF(
                    SECOND,
                    '1970-01-01',
                    DATEADD(day, 1, CONVERT(date, @date))
                )

                ORDER BY
                    el.nUserID ASC,
                    el.nDateTime ASC
            `);

        return NextResponse.json({
            success: true,
            date,
            count: result.recordset.length,
            punches: result.recordset,
        });
    } catch (error) {
        console.error("Attendance aggregation error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch attendance data",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

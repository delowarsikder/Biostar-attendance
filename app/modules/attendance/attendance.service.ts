import { attendanceRepository } from "./attendance.repository";

import type {
    AttendanceFilters,
    AttendanceResponse,
} from "./attendance.types";

export class AttendanceService {
    async getAttendance(
        filters: AttendanceFilters
    ): Promise<AttendanceResponse> {
        const result =
            await attendanceRepository.findDailyAttendance(
                filters
            );

        const totalPages =
            result.total === 0
                ? 0
                : Math.ceil(
                    result.total / filters.pageSize
                );

        return {
            data: result.records,

            summary: result.summary,

            pagination: {
                page: filters.page,
                pageSize: filters.pageSize,
                total: result.total,
                totalPages,
            },
        };
    }
}

export const attendanceService =
    new AttendanceService();
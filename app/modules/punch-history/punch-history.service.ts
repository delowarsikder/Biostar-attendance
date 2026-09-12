import { PunchHistoryRepository } from "./punch-history.repository";

import {
  PunchHistoryFilters,
  PunchHistoryResponse,
} from "./punch-history.types";

export class PunchHistoryService {
  private repository: PunchHistoryRepository;

  constructor() {
    this.repository = new PunchHistoryRepository();
  }

  async getPunchHistory(
    filters: PunchHistoryFilters
  ): Promise<PunchHistoryResponse> {
    const punches =
      await this.repository.getPunchHistory(filters);

    if (punches.length === 0) {
      return {
        employee: null,
        date: filters.date,
        totalPunches: 0,
        punches: [],
      };
    }

    return {
      employee: {
        employeeId: punches[0].employeeId,
        employeeName: punches[0].employeeName,
      },

      date: filters.date,

      totalPunches: punches.length,

      punches,
    };
  }
}
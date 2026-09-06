import { EventsRepository } from "./events-log.repository";

import {
  EventHistoryFilters,
  EventHistoryResponse,
} from "./events-log.types";

export interface EventsServiceParams extends EventHistoryFilters {
  page: number;
  pageSize: number;
}

export interface EventsServiceResult {
  events: EventHistoryResponse["events"];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class EventsService {
  private repository: EventsRepository;

  constructor() {
    this.repository = new EventsRepository();
  }

  async getEvents(
    params: EventsServiceParams
  ): Promise<EventsServiceResult> {
    const { page, pageSize, ...filters } = params;

    const events =
      await this.repository.getEvents(filters);

    const total = events.length;
    const totalPages = Math.ceil(total / pageSize);

    const start = (page - 1) * pageSize;
    const paginatedEvents = events.slice(start, start + pageSize);

    return {
      events: paginatedEvents,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
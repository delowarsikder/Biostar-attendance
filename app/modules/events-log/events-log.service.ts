import { EventsRepository } from "./events-log.repository";

import {
  EventHistoryFilters,
  EventHistoryResponse,
} from "./events-log.types";

export class EventsService {
  private repository: EventsRepository;

  constructor() {
    this.repository = new EventsRepository();
  }

  async getEvents(
    filters: EventHistoryFilters
  ): Promise<EventHistoryResponse> {
    const events =
      await this.repository.getEvents(filters);

    return {
      total: events.length,
      events,
    };
  }
}
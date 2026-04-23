import type { Event } from "@prisma/client";
import type { EventBus } from "./event-bus.js";
import { DOMAIN_EVENT_CREATED, type DomainEventCreatedPayload } from "./domain-events.js";
import { eventTypeToApi } from "../utils/event-type-api.js";

export function toDomainEventCreatedPayload(row: Event): DomainEventCreatedPayload {
  return {
    id: row.id,
    accountId: row.accountId,
    userId: row.userId,
    type: row.type,
    typeApi: eventTypeToApi(row.type),
    createdAt: row.createdAt,
    metadata: row.metadata,
  };
}

export function publishEventCreated(bus: EventBus, row: Event): void {
  bus.emit(DOMAIN_EVENT_CREATED, toDomainEventCreatedPayload(row));
}

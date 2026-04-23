import type { Event } from "@prisma/client";
import type { EventBus } from "./event-bus.js";
import { DOMAIN_EVENT_CREATED } from "./domain-events.js";
import { eventTypeToApi } from "../utils/event-type-api.js";

export function publishEventCreated(bus: EventBus, row: Event): void {
  bus.emit(DOMAIN_EVENT_CREATED, {
    id: row.id,
    accountId: row.accountId,
    userId: row.userId,
    type: row.type,
    typeApi: eventTypeToApi(row.type),
    createdAt: row.createdAt,
    metadata: row.metadata,
  });
}

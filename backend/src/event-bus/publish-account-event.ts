import type { Event } from "@prisma/client";
import type { EventBus } from "./event-bus.js";
import { ACCOUNT_EVENT_CREATED, type AccountEventCreatedPayload } from "./account-events.js";
import { eventTypeToApi } from "../utils/event-type-api.js";

export function toAccountEventCreatedPayload(row: Event): AccountEventCreatedPayload {
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

export function publishAccountEventCreated(bus: EventBus, row: Event): void {
  bus.emit(ACCOUNT_EVENT_CREATED, toAccountEventCreatedPayload(row));
}

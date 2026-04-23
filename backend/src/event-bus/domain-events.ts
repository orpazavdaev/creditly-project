import type { EventType } from "@prisma/client";

export const DOMAIN_EVENT_CREATED = "event.created";

export type DomainEventCreatedPayload = {
  id: string;
  accountId: string;
  userId: string;
  type: EventType;
  typeApi: string;
  createdAt: Date;
  metadata: unknown;
};

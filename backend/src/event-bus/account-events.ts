import type { EventType } from "@prisma/client";

export const ACCOUNT_EVENT_CREATED = "event.created";

export type AccountEventCreatedPayload = {
  id: string;
  accountId: string;
  userId: string;
  type: EventType;
  typeApi: string;
  createdAt: Date;
  metadata: unknown;
};

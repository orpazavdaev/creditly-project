import type { EventType } from "@prisma/client";

const API_TO_PRISMA: Record<string, EventType> = {
  document_uploaded: "DOCUMENT_UPLOADED",
  note_added: "NOTE_ADDED",
  status_changed: "STATUS_CHANGED",
  auction_opened: "AUCTION_OPENED",
  offer_submitted: "OFFER_SUBMITTED",
  auction_closed: "AUCTION_CLOSED",
};

const PRISMA_TO_API: Record<EventType, string> = {
  DOCUMENT_UPLOADED: "document_uploaded",
  NOTE_ADDED: "note_added",
  STATUS_CHANGED: "status_changed",
  AUCTION_OPENED: "auction_opened",
  OFFER_SUBMITTED: "offer_submitted",
  AUCTION_CLOSED: "auction_closed",
};

export function parseEventTypeFromApi(value: string): EventType | null {
  return API_TO_PRISMA[value] ?? null;
}

export function eventTypeToApi(value: EventType): string {
  return PRISMA_TO_API[value];
}

export const API_EVENT_TYPES = Object.keys(API_TO_PRISMA);

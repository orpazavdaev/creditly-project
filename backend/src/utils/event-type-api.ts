import { EventType } from "@prisma/client";

const API_TO_PRISMA: Record<string, EventType> = {
  document_uploaded: EventType.DOCUMENT_UPLOADED,
  note_added: EventType.NOTE_ADDED,
  status_changed: EventType.STATUS_CHANGED,
  auction_opened: EventType.AUCTION_OPENED,
  offer_submitted: EventType.OFFER_SUBMITTED,
  auction_closed: EventType.AUCTION_CLOSED,
};

const PRISMA_TO_API: Record<EventType, string> = {
  [EventType.DOCUMENT_UPLOADED]: "document_uploaded",
  [EventType.NOTE_ADDED]: "note_added",
  [EventType.STATUS_CHANGED]: "status_changed",
  [EventType.AUCTION_OPENED]: "auction_opened",
  [EventType.OFFER_SUBMITTED]: "offer_submitted",
  [EventType.AUCTION_CLOSED]: "auction_closed",
};

export function parseEventTypeFromApi(value: string): EventType | null {
  return API_TO_PRISMA[value] ?? null;
}

export function eventTypeToApi(value: EventType): string {
  return PRISMA_TO_API[value];
}

export const API_EVENT_TYPES = Object.keys(API_TO_PRISMA);

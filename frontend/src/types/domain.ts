export const USER_ROLE_VALUES = ["ADMIN", "MANAGER", "USER", "BANKER"] as const;
export type UserRole = (typeof USER_ROLE_VALUES)[number];

export const ACCOUNT_STATUS_VALUES = [
  "NEW",
  "READY_FOR_AUCTION",
  "AUCTION_OPEN",
  "WON",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUS_VALUES)[number];

export const SYNC_STATUS_VALUES = ["SUCCESS", "FAILED"] as const;
export type SyncStatus = (typeof SYNC_STATUS_VALUES)[number];

export const SPECIALISATION_VALUES = [
  "NEW_MORTGAGE",
  "REFINANCE",
  "PERSONAL_LOAN",
  "BUSINESS_LOAN",
] as const;
export type Specialisation = (typeof SPECIALISATION_VALUES)[number];

export const AUCTION_OPPORTUNITY_STATUS_VALUES = ["OPEN", "EXPIRED", "CLOSED"] as const;
export type AuctionOpportunityStatus = (typeof AUCTION_OPPORTUNITY_STATUS_VALUES)[number];

export const EVENT_TYPE_API_VALUES = [
  "document_uploaded",
  "note_added",
  "status_changed",
  "auction_opened",
  "offer_submitted",
  "auction_closed",
] as const;
export type EventTypeApi = (typeof EVENT_TYPE_API_VALUES)[number];

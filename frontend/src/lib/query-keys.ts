import { API_BASE } from "./config";

export const queryKeys = {
  accounts: (userId: string) => ["accounts", API_BASE, userId] as const,
  account: (userId: string, accountId: string) => ["account", accountId, API_BASE, userId] as const,
  events: (userId: string, accountId: string) => ["events", API_BASE, accountId, userId] as const,
  auctions: (userId: string) => ["auctions", API_BASE, userId] as const,
  auctionOffers: (userId: string, auctionId: string) => ["auctionOffers", API_BASE, auctionId, userId] as const,
  assignableUsers: (userId: string) => ["users", "assignable", API_BASE, userId] as const,
  analytics: (userId: string) => ["analytics", "summary", API_BASE, userId] as const,
};

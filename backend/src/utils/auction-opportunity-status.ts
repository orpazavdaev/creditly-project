import type { AuctionOpportunityStatus } from "@prisma/client";

export function effectiveAuctionOpportunityStatus(
  status: AuctionOpportunityStatus,
  expiresAt: Date,
  now: Date = new Date()
): AuctionOpportunityStatus {
  if (status === "OPEN" && expiresAt.getTime() <= now.getTime()) {
    return "EXPIRED";
  }
  return status;
}

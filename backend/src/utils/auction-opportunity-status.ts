import { AuctionOpportunityStatus } from "@prisma/client";

export function effectiveAuctionOpportunityStatus(
  status: AuctionOpportunityStatus,
  expiresAt: Date,
  now: Date = new Date()
): AuctionOpportunityStatus {
  if (status === AuctionOpportunityStatus.OPEN && expiresAt.getTime() <= now.getTime()) {
    return AuctionOpportunityStatus.EXPIRED;
  }
  return status;
}

import type { AuctionOpportunity, Event, Specialisation } from "@prisma/client";
import { prisma } from "./prisma.js";

export class AccountAuctionRepository {
  findAccountForAuctionCreate(accountId: string) {
    return prisma.account.findUnique({
      where: { id: accountId },
      include: { auctionOpportunity: { select: { id: true } } },
    });
  }

  createAuctionAndOpenedEvent(data: {
    accountId: string;
    userId: string;
    classification: Specialisation;
    openedAt: Date;
    expiresAt: Date;
  }): Promise<{ auction: AuctionOpportunity; eventRow: Event }> {
    return prisma.$transaction(async (tx) => {
      const auction = await tx.auctionOpportunity.create({
        data: {
          accountId: data.accountId,
          classification: data.classification,
          status: "OPEN",
          openedBy: data.userId,
          openedAt: data.openedAt,
          expiresAt: data.expiresAt,
        },
      });
      const eventRow = await tx.event.create({
        data: {
          accountId: data.accountId,
          userId: data.userId,
          type: "AUCTION_OPENED",
          metadata: { auctionId: auction.id },
        },
      });
      return { auction, eventRow };
    });
  }
}

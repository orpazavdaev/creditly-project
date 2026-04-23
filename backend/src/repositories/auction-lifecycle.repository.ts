import type { Event } from "@prisma/client";
import { prisma } from "./prisma.js";

export type AuctionCloseRow = {
  id: string;
  accountId: string;
  status: "OPEN" | "EXPIRED" | "CLOSED";
  _count: { bankOffers: number };
};

export class AuctionLifecycleRepository {
  expireOpenIfPastDue(auctionId: string): Promise<void> {
    return prisma.auctionOpportunity
      .updateMany({
        where: {
          id: auctionId,
          status: "OPEN",
          expiresAt: { lte: new Date() },
        },
        data: {
          status: "EXPIRED",
          closedAt: new Date(),
          winningOfferId: null,
        },
      })
      .then(() => undefined);
  }

  findForClose(auctionId: string): Promise<AuctionCloseRow | null> {
    return prisma.auctionOpportunity.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        accountId: true,
        status: true,
        _count: { select: { bankOffers: true } },
      },
    });
  }

  createAuctionClosedEvent(data: {
    accountId: string;
    userId: string;
    auctionId: string;
  }): Promise<Event> {
    return prisma.event.create({
      data: {
        accountId: data.accountId,
        userId: data.userId,
        type: "AUCTION_CLOSED",
        metadata: { auctionId: data.auctionId },
      },
    });
  }
}

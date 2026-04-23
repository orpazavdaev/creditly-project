import { AuctionOpportunityStatus, EventType, type Event } from "@prisma/client";
import { prisma } from "./prisma.js";

export type AuctionCloseRow = {
  id: string;
  accountId: string;
  status: AuctionOpportunityStatus;
  expiresAt: Date;
  _count: { bankOffers: number };
};

export class AuctionLifecycleRepository {
  expireOpenIfPastDue(auctionId: string): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const row = await tx.auctionOpportunity.findUnique({
        where: { id: auctionId },
        select: {
          status: true,
          expiresAt: true,
          _count: { select: { bankOffers: true } },
        },
      });
      if (!row || row.status !== AuctionOpportunityStatus.OPEN || row.expiresAt > new Date()) {
        return;
      }
      if (row._count.bankOffers > 0) {
        return;
      }
      await tx.auctionOpportunity.update({
        where: { id: auctionId },
        data: { status: AuctionOpportunityStatus.EXPIRED, closedAt: new Date(), winningOfferId: null },
      });
    });
  }

  expireAllOpenPastDueWithNoBids(): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const rows = await tx.auctionOpportunity.findMany({
        where: { status: AuctionOpportunityStatus.OPEN, expiresAt: { lte: now } },
        select: { id: true, _count: { select: { bankOffers: true } } },
      });
      for (const r of rows) {
        if (r._count.bankOffers > 0) continue;
        await tx.auctionOpportunity.update({
          where: { id: r.id },
          data: { status: AuctionOpportunityStatus.EXPIRED, closedAt: now, winningOfferId: null },
        });
      }
    });
  }

  findForClose(auctionId: string): Promise<AuctionCloseRow | null> {
    return prisma.auctionOpportunity.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        accountId: true,
        status: true,
        expiresAt: true,
        _count: { select: { bankOffers: true } },
      },
    });
  }

  async finalizeExpiredWithoutBids(auctionId: string): Promise<void> {
    await prisma.auctionOpportunity.updateMany({
      where: { id: auctionId, status: AuctionOpportunityStatus.EXPIRED },
      data: { status: AuctionOpportunityStatus.CLOSED },
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
        type: EventType.AUCTION_CLOSED,
        metadata: { auctionId: data.auctionId },
      },
    });
  }
}

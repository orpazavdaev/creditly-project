import {
  AccountStatus,
  AuctionOpportunityStatus,
  EventType,
  type AuctionOpportunity,
  type BankOffer,
  type Event,
} from "@prisma/client";
import { prisma } from "./prisma.js";

export class EventSideEffectRepository {
  updateAccountDocumentState(accountId: string, lastActivity: Date): Promise<boolean> {
    return prisma.account
      .updateMany({
        where: { id: accountId, status: AccountStatus.NEW },
        data: { status: AccountStatus.READY_FOR_AUCTION, lastActivity },
      })
      .then((result) => result.count > 0);
  }

  createStatusChangedEvent(data: {
    accountId: string;
    userId: string;
    fromStatus: AccountStatus;
    toStatus: AccountStatus;
    metadata?: Record<string, unknown>;
  }): Promise<Event> {
    return prisma.event.create({
      data: {
        accountId: data.accountId,
        userId: data.userId,
        type: EventType.STATUS_CHANGED,
        metadata: {
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          ...(data.metadata ?? {}),
        },
      },
    });
  }

  countEventsSince(accountId: string, since: Date): Promise<number> {
    return prisma.event.count({
      where: { accountId, createdAt: { gte: since } },
    });
  }

  updateAccountHighActivity(accountId: string, isHighActivity: boolean): Promise<void> {
    return prisma.account
      .update({
        where: { id: accountId },
        data: { isHighActivity },
      })
      .then(() => undefined);
  }

  findAuctionWithOffersByAccountId(
    accountId: string
  ): Promise<(AuctionOpportunity & { bankOffers: BankOffer[] }) | null> {
    return prisma.auctionOpportunity.findUnique({
      where: { accountId },
      include: {
        bankOffers: {
          orderBy: [{ totalInterestRate: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  }

  updateAuctionExpired(auctionId: string, closedAt: Date): Promise<void> {
    return prisma.auctionOpportunity
      .update({
        where: { id: auctionId },
        data: { status: AuctionOpportunityStatus.EXPIRED, closedAt, winningOfferId: null },
      })
      .then(() => undefined);
  }

  closeAuctionAndMarkAccountWon(
    auctionId: string,
    accountId: string,
    winningOfferId: string,
    closedAt: Date
  ): Promise<void> {
    return prisma
      .$transaction([
        prisma.auctionOpportunity.update({
          where: { id: auctionId },
          data: { status: AuctionOpportunityStatus.CLOSED, closedAt, winningOfferId },
        }),
        prisma.account.update({
          where: { id: accountId },
          data: { status: AccountStatus.WON },
        }),
      ])
      .then(() => undefined);
  }
}

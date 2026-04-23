import {
  AccountStatus,
  AuctionOpportunityStatus,
  type AuctionOpportunity,
  type BankOffer,
} from "@prisma/client";
import { prisma } from "./prisma.js";

export class DomainEventBusinessRepository {
  updateAccountDocumentState(accountId: string, lastActivity: Date): Promise<void> {
    return prisma.account
      .updateMany({
        where: { id: accountId, status: AccountStatus.NEW },
        data: { status: AccountStatus.READY_FOR_AUCTION, lastActivity },
      })
      .then(() => undefined);
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

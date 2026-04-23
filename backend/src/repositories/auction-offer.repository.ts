import {
  EventType,
  type AuctionOpportunity,
  type BankOffer,
  type Event,
  type Specialisation,
} from "@prisma/client";
import { prisma } from "./prisma.js";

export type BankerForList = {
  bankId: string | null;
  role: string;
  specialisation: Specialisation[];
};

export type BankerForSubmit = {
  bankId: string | null;
  specialisation: string[];
  role: string;
  email: string;
};

const DUPLICATE_OFFER_MSG = "DUPLICATE_OFFER";

export class AuctionOfferRepository {
  findBankerForList(userId: string): Promise<BankerForList | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { bankId: true, role: true, specialisation: true },
    });
  }

  findAuctionByIdForList(auctionId: string): Promise<{
    id: string;
    classification: AuctionOpportunity["classification"];
    status: AuctionOpportunity["status"];
    expiresAt: Date;
  } | null> {
    return prisma.auctionOpportunity.findUnique({
      where: { id: auctionId },
      select: { id: true, classification: true, status: true, expiresAt: true },
    });
  }

  findAuctionByIdForAdminList(auctionId: string): Promise<{
    id: string;
    accountId: string;
    classification: AuctionOpportunity["classification"];
    status: AuctionOpportunity["status"];
    expiresAt: Date;
    openedAt: Date;
  } | null> {
    return prisma.auctionOpportunity.findUnique({
      where: { id: auctionId },
      select: { id: true, accountId: true, classification: true, status: true, expiresAt: true, openedAt: true },
    });
  }

  findAllOffersByAuctionForAdmin(auctionId: string): Promise<
    (BankOffer & {
      bank: { name: string };
      banker: { email: string };
    })[]
  > {
    return prisma.bankOffer.findMany({
      where: { auctionOpportunityId: auctionId },
      include: {
        bank: { select: { name: true } },
        banker: { select: { email: true } },
      },
      orderBy: [{ totalInterestRate: "asc" }, { createdAt: "asc" }],
    });
  }

  findOffersByAuctionAndBank(auctionId: string, bankId: string): Promise<BankOffer[]> {
    return prisma.bankOffer.findMany({
      where: { auctionOpportunityId: auctionId, bankId },
      orderBy: { createdAt: "desc" },
    });
  }

  findBankerForSubmit(userId: string): Promise<BankerForSubmit | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { bankId: true, specialisation: true, role: true, email: true },
    });
  }

  findAuctionById(auctionId: string): Promise<AuctionOpportunity | null> {
    return prisma.auctionOpportunity.findUnique({
      where: { id: auctionId },
    });
  }

  findOfferByAuctionAndBanker(auctionId: string, bankerId: string): Promise<{ id: string } | null> {
    return prisma.bankOffer.findFirst({
      where: { auctionOpportunityId: auctionId, bankerId },
      select: { id: true },
    });
  }

  createOfferAndSubmittedEvent(data: {
    auctionId: string;
    accountId: string;
    userId: string;
    bankId: string;
    totalInterestRate: number;
  }): Promise<{ offer: BankOffer; eventRow: Event }> {
    return prisma.$transaction(async (tx) => {
      const dup = await tx.bankOffer.findFirst({
        where: { auctionOpportunityId: data.auctionId, bankerId: data.userId },
        select: { id: true },
      });
      if (dup) {
        throw new Error(DUPLICATE_OFFER_MSG);
      }
      const offer = await tx.bankOffer.create({
        data: {
          auctionOpportunityId: data.auctionId,
          bankId: data.bankId,
          bankerId: data.userId,
          totalInterestRate: data.totalInterestRate,
        },
      });
      const eventRow = await tx.event.create({
        data: {
          accountId: data.accountId,
          userId: data.userId,
          type: EventType.OFFER_SUBMITTED,
          metadata: {
            auctionId: data.auctionId,
            offerId: offer.id,
            totalInterestRate: data.totalInterestRate,
          },
        },
      });
      return { offer, eventRow };
    });
  }
}

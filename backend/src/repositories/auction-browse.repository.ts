import type { AuctionOpportunityStatus, Specialisation } from "@prisma/client";
import { prisma } from "./prisma.js";

export type AuctionBrowseRow = {
  id: string;
  classification: Specialisation;
  status: AuctionOpportunityStatus;
  openedAt: Date;
  expiresAt: Date;
  closedAt: Date | null;
};

export type AdminAuctionBrowseRow = AuctionBrowseRow & {
  accountId: string;
  winningOffer: { totalInterestRate: number; bank: { name: string } } | null;
};

export class AuctionBrowseRepository {
  findBankerProfile(userId: string): Promise<{
    role: string;
    specialisation: Specialisation[];
  } | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, specialisation: true },
    });
  }

  findAll(): Promise<AdminAuctionBrowseRow[]> {
    return prisma.auctionOpportunity.findMany({
      select: {
        id: true,
        accountId: true,
        classification: true,
        status: true,
        openedAt: true,
        expiresAt: true,
        closedAt: true,
        winningOffer: {
          select: {
            totalInterestRate: true,
            bank: { select: { name: true } },
          },
        },
      },
      orderBy: { openedAt: "desc" },
    });
  }

  findRelevantByClassifications(classifications: Specialisation[]): Promise<AuctionBrowseRow[]> {
    if (classifications.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.auctionOpportunity.findMany({
      where: {
        classification: { in: classifications },
        status: "OPEN",
      },
      select: {
        id: true,
        classification: true,
        status: true,
        openedAt: true,
        expiresAt: true,
        closedAt: true,
      },
      orderBy: { openedAt: "desc" },
    });
  }
}

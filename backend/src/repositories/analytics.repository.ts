import { AccountStatus, AuctionOpportunityStatus, SyncStatus } from "@prisma/client";
import { prisma } from "./prisma.js";

export type AnalyticsRawSummary = {
  totalAccounts: number;
  wonAccounts: number;
  highActivityAccounts: number;
  crmSyncSuccess: number;
  crmSyncFailure: number;
  totalAuctions: number;
  auctionsOpen: number;
  auctionsClosed: number;
  auctionsExpired: number;
  totalOffers: number;
  averageInterestRate: number | null;
  bestInterestRate: number | null;
};

export class AnalyticsRepository {
  async summarizeForScope(managerId: string | null): Promise<AnalyticsRawSummary> {
    const accountWhere = managerId !== null ? { managerId } : {};
    const auctionWhere = managerId !== null ? { account: { managerId } } : {};
    const offerWhere =
      managerId !== null ? { auctionOpportunity: { account: { managerId } } } : {};

    const [
      totalAccounts,
      wonAccounts,
      highActivityAccounts,
      crmSyncSuccess,
      crmSyncFailure,
      totalAuctions,
      auctionsOpen,
      auctionsClosed,
      auctionsExpired,
      offerStats,
    ] = await Promise.all([
      prisma.account.count({ where: accountWhere }),
      prisma.account.count({ where: { ...accountWhere, status: AccountStatus.WON } }),
      prisma.account.count({ where: { ...accountWhere, isHighActivity: true } }),
      prisma.account.count({ where: { ...accountWhere, syncStatus: SyncStatus.SYNCED } }),
      prisma.account.count({ where: { ...accountWhere, syncStatus: SyncStatus.FAILED } }),
      prisma.auctionOpportunity.count({ where: auctionWhere }),
      prisma.auctionOpportunity.count({ where: { ...auctionWhere, status: AuctionOpportunityStatus.OPEN } }),
      prisma.auctionOpportunity.count({
        where: { ...auctionWhere, status: AuctionOpportunityStatus.CLOSED },
      }),
      prisma.auctionOpportunity.count({
        where: { ...auctionWhere, status: AuctionOpportunityStatus.EXPIRED },
      }),
      prisma.bankOffer.aggregate({
        where: offerWhere,
        _avg: { totalInterestRate: true },
        _min: { totalInterestRate: true },
        _count: { id: true },
      }),
    ]);

    const totalOffers = offerStats._count.id;
    const averageInterestRate =
      totalOffers > 0 && offerStats._avg.totalInterestRate !== null
        ? offerStats._avg.totalInterestRate
        : null;
    const bestInterestRate =
      totalOffers > 0 && offerStats._min.totalInterestRate !== null
        ? offerStats._min.totalInterestRate
        : null;

    return {
      totalAccounts,
      wonAccounts,
      highActivityAccounts,
      crmSyncSuccess,
      crmSyncFailure,
      totalAuctions,
      auctionsOpen,
      auctionsClosed,
      auctionsExpired,
      totalOffers,
      averageInterestRate,
      bestInterestRate,
    };
  }
}

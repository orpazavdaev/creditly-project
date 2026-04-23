import type { AnalyticsRawSummary } from "../repositories/analytics.repository.js";

export type AnalyticsSummaryApi = {
  totalAccounts: number;
  wonAccounts: number;
  totalAuctions: number;
  auctionsOpen: number;
  auctionsClosed: number;
  auctionsExpired: number;
  totalOffers: number;
  averageInterestRate: number | null;
  bestInterestRate: number | null;
  highActivityAccounts: number;
  crmSyncSuccess: number;
  crmSyncFailure: number;
};

function roundRate(v: number): number {
  return Math.round(v * 1_000_000) / 1_000_000;
}

export function toAnalyticsSummaryApi(raw: AnalyticsRawSummary): AnalyticsSummaryApi {
  return {
    totalAccounts: raw.totalAccounts,
    wonAccounts: raw.wonAccounts,
    totalAuctions: raw.totalAuctions,
    auctionsOpen: raw.auctionsOpen,
    auctionsClosed: raw.auctionsClosed,
    auctionsExpired: raw.auctionsExpired,
    totalOffers: raw.totalOffers,
    averageInterestRate:
      raw.averageInterestRate !== null ? roundRate(raw.averageInterestRate) : null,
    bestInterestRate: raw.bestInterestRate !== null ? roundRate(raw.bestInterestRate) : null,
    highActivityAccounts: raw.highActivityAccounts,
    crmSyncSuccess: raw.crmSyncSuccess,
    crmSyncFailure: raw.crmSyncFailure,
  };
}

import type { AccountStaffDetailRow, AccountStaffListRow } from "../repositories/account.repository.js";
import { emailLocalPart } from "../utils/email-display.js";
import { effectiveAuctionOpportunityStatus } from "../utils/auction-opportunity-status.js";

export type AccountStaffListItem = {
  id: string;
  managerId: string;
  managerLabel: string;
  costumerEmail: string;
  costumerPhone: string;
  costumerName: string;
  status: string;
  lastActivity: string;
  isHighActivity: boolean;
  syncStatus: string;
  failureReason: string | null;
  createdAt: string;
};

export type AccountStaffDetailItem = AccountStaffListItem & {
  auction: {
    id: string;
    status: string;
    openedAt: string;
    expiresAt: string;
    closedAt: string | null;
    classification: string;
    winningOffer: { totalInterestRate: number; bankName: string } | null;
    canCloseAuction: boolean;
  } | null;
};

export function toAccountStaffListItem(row: AccountStaffListRow): AccountStaffListItem {
  return {
    id: row.id,
    managerId: row.managerId,
    managerLabel: emailLocalPart(row.manager.email),
    costumerEmail: row.costumerEmail,
    costumerPhone: row.costumerPhone,
    costumerName: row.costumerName,
    status: row.status,
    lastActivity: row.lastActivity.toISOString(),
    isHighActivity: row.isHighActivity,
    syncStatus: row.syncStatus,
    failureReason: row.failureReason,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAccountStaffDetailItem(row: AccountStaffDetailRow): AccountStaffDetailItem {
  const base = toAccountStaffListItem(row);
  const auc = row.auctionOpportunity;
  const now = new Date();
  if (!auc) {
    return { ...base, auction: null };
  }
  const displayStatus = effectiveAuctionOpportunityStatus(auc.status, auc.expiresAt, now);
  return {
    ...base,
    auction: {
      id: auc.id,
      status: displayStatus,
      openedAt: auc.openedAt.toISOString(),
      expiresAt: auc.expiresAt.toISOString(),
      closedAt: auc.closedAt ? auc.closedAt.toISOString() : null,
      classification: auc.classification,
      winningOffer: auc.winningOffer
        ? {
            totalInterestRate: auc.winningOffer.totalInterestRate,
            bankName: auc.winningOffer.bank.name,
          }
        : null,
      canCloseAuction: auc.status !== "CLOSED" && auc.expiresAt.getTime() <= now.getTime(),
    },
  };
}

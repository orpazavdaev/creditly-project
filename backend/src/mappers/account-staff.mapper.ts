import type { AccountStaffDetailRow, AccountStaffListRow } from "../repositories/account.repository.js";

export type AccountStaffListItem = {
  id: string;
  managerId: string;
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
    expiresAt: string;
    classification: string;
  } | null;
};

export function toAccountStaffListItem(row: AccountStaffListRow): AccountStaffListItem {
  return {
    id: row.id,
    managerId: row.managerId,
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
  return {
    ...base,
    auction: auc
      ? {
          id: auc.id,
          status: auc.status,
          expiresAt: auc.expiresAt.toISOString(),
          classification: auc.classification,
        }
      : null,
  };
}

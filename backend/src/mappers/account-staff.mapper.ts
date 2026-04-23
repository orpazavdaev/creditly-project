import type { AccountStaffListRow } from "../repositories/account.repository.js";

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

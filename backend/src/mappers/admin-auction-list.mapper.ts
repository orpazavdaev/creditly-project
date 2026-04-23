import type { AdminAuctionBrowseRow } from "../repositories/auction-browse.repository.js";

export type AdminAuctionListItem = {
  id: string;
  accountId: string;
  classification: string;
  status: string;
  openedAt: string;
  expiresAt: string;
  closedAt: string | null;
  winningOffer: { totalInterestRate: number; bankName: string } | null;
};

export function toAdminAuctionListItem(row: AdminAuctionBrowseRow): AdminAuctionListItem {
  const win = row.winningOffer;
  return {
    id: row.id,
    accountId: row.accountId,
    classification: row.classification,
    status: row.status,
    openedAt: row.openedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    winningOffer: win
      ? { totalInterestRate: win.totalInterestRate, bankName: win.bank.name }
      : null,
  };
}

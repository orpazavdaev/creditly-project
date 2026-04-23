import type { AuctionBrowseRow } from "../repositories/auction-browse.repository.js";

export type BankerAuctionListItem = {
  id: string;
  classification: string;
  status: string;
  openedAt: string;
  expiresAt: string;
  closedAt: string | null;
};

export function toBankerAuctionListItem(row: AuctionBrowseRow): BankerAuctionListItem {
  return {
    id: row.id,
    classification: row.classification,
    status: row.status,
    openedAt: row.openedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
  };
}

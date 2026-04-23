import type { AuctionOpportunityStatus } from "@/types/domain";
import styles from "@/app/ui.module.css";

export function auctionStatusClass(status: AuctionOpportunityStatus): string {
  if (status === "OPEN") return styles.auctionStatusOpen;
  if (status === "EXPIRED") return styles.auctionStatusExpired;
  return styles.auctionStatusClosed;
}

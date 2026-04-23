"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import type { BankerAuctionRow } from "@/types/api";
import styles from "@/app/ui.module.css";

export default function AuctionsPage() {
  const q = useQuery({
    queryKey: ["auctions", API_BASE],
    queryFn: () => apiFetch<{ auctions: BankerAuctionRow[] }>("/auctions"),
  });

  if (q.isPending) {
    return (
      <>
        <h1 className={styles.pageTitle}>Auctions</h1>
        <p className={styles.muted}>Loading auctions…</p>
      </>
    );
  }

  if (q.isError) {
    return (
      <>
        <h1 className={styles.pageTitle}>Auctions</h1>
        <div className={styles.errorBox}>{q.error instanceof Error ? q.error.message : "Failed to load"}</div>
      </>
    );
  }

  const rows = q.data?.auctions ?? [];

  return (
    <>
      <h1 className={styles.pageTitle}>Auctions</h1>
      <p className={styles.pageSubtitle}>Open and recently expired auctions that match your specialisation.</p>
      {rows.length === 0 ? (
        <div className={styles.card}>
          <p className={styles.muted}>No matching auctions right now.</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {rows.map((a) => (
            <div key={a.id} className={styles.cardRow}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.classification.replace(/_/g, " ")}</div>
                <div className={styles.muted} style={{ fontSize: "0.85rem" }}>
                  Expires {new Date(a.expiresAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span className={styles.badge}>{a.status}</span>
                <Link href={`/auctions/${a.id}/offer`} className={styles.btnSecondary} style={{ display: "inline-block", textAlign: "center", padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}>
                  Offers
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminAllAuctionRow } from "@/types/api";
import styles from "@/app/ui.module.css";

export default function StaffAuctionsPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: user ? queryKeys.staffAuctionsAll(user.id) : ["staffAuctions", "pending"],
    queryFn: () => apiFetch<{ auctions: AdminAllAuctionRow[] }>("/auctions"),
    enabled: Boolean(user),
  });

  if (q.isPending) {
    return (
      <>
        <h1 className={styles.pageTitle}>All auctions</h1>
        <p className={styles.muted}>Loading…</p>
      </>
    );
  }

  if (q.isError) {
    return (
      <>
        <h1 className={styles.pageTitle}>All auctions</h1>
        <div className={styles.errorBox}>{q.error instanceof Error ? q.error.message : "Failed to load"}</div>
      </>
    );
  }

  const rows = q.data?.auctions ?? [];

  return (
    <>
      <h1 className={styles.pageTitle}>All auctions</h1>
      <p className={styles.pageSubtitle}>Every auction in the system (admin view).</p>
      {rows.length === 0 ? (
        <div className={styles.card}>
          <p className={styles.muted}>No auctions yet.</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {rows.map((a) => (
            <div key={a.id} className={styles.cardRow}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.classification.replace(/_/g, " ")}</div>
                <div className={styles.muted} style={{ fontSize: "0.85rem" }}>
                  Account {a.accountId.slice(0, 8)}… · opened {new Date(a.openedAt).toLocaleString()}
                </div>
                {a.status === "CLOSED" && a.winningOffer && (
                  <div className={styles.muted} style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
                    Winning offer: {a.winningOffer.totalInterestRate}% · {a.winningOffer.bankName}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span className={styles.badge}>{a.status}</span>
                <span className={styles.muted} style={{ fontSize: "0.8rem" }}>
                  Expires {new Date(a.expiresAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: "1rem" }}>
        <Link href="/accounts" className={styles.link}>
          ← Accounts
        </Link>
      </p>
    </>
  );
}

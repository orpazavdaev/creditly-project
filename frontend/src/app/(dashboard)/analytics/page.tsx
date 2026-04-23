"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiFetch, getApiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsSummary } from "@/types/api";
import styles from "@/app/ui.module.css";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.card} style={{ padding: "0.9rem 1rem" }}>
      <div className={styles.muted} style={{ fontSize: "0.8rem", marginBottom: "0.35rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "inherit" }}>{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: user ? queryKeys.analytics(user.id) : ["analytics", "pending"],
    queryFn: () => apiFetch<{ summary: AnalyticsSummary }>("/analytics/summary"),
    enabled: Boolean(user),
  });

  if (q.isLoading) {
    return (
      <>
        <h1 className={styles.pageTitle}>Analytics</h1>
        <p className={styles.muted}>Loading…</p>
      </>
    );
  }

  if (q.isError) {
    return (
      <>
        <h1 className={styles.pageTitle}>Analytics</h1>
        <div className={styles.errorBox}>{getApiErrorMessage(q.error, "Failed to load")}</div>
      </>
    );
  }

  const s = q.data?.summary;
  if (!s) {
    return <p className={styles.muted}>No data.</p>;
  }

  const rate = (v: number | null) => (v === null ? "—" : `${v}%`);

  return (
    <>
      <h1 className={styles.pageTitle}>Analytics</h1>
      <p className={styles.pageSubtitle}>Summary across all accounts and auctions.</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
          gap: "0.75rem",
        }}
      >
        <Stat label="Total accounts" value={s.totalAccounts} />
        <Stat label="Won accounts" value={s.wonAccounts} />
        <Stat label="High activity accounts" value={s.highActivityAccounts} />
        <Stat label="CRM sync success" value={s.crmSyncSuccess} />
        <Stat label="CRM sync failure" value={s.crmSyncFailure} />
        <Stat label="Total auctions" value={s.totalAuctions} />
        <Stat label="Auctions open" value={s.auctionsOpen} />
        <Stat label="Auctions closed" value={s.auctionsClosed} />
        <Stat label="Auctions expired" value={s.auctionsExpired} />
        <Stat label="Total offers" value={s.totalOffers} />
        <Stat label="Average interest" value={rate(s.averageInterestRate)} />
        <Stat label="Best interest" value={rate(s.bestInterestRate)} />
      </div>
    </>
  );
}

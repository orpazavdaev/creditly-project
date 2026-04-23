"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AccountListItem } from "@/types/api";
import { canCreateAccount } from "@/types/roles";
import styles from "@/app/ui.module.css";

export default function AccountsPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: user ? queryKeys.accounts(user.id) : ["accounts", "pending"],
    queryFn: () => apiFetch<{ accounts: AccountListItem[] }>("/accounts"),
    enabled: Boolean(user),
  });

  if (q.isLoading) {
    return (
      <>
        <h1 className={styles.pageTitle}>Accounts</h1>
        <p className={styles.muted}>Loading accounts…</p>
      </>
    );
  }

  if (q.isError) {
    return (
      <>
        <h1 className={styles.pageTitle}>Accounts</h1>
        <div className={styles.errorBox}>{q.error instanceof Error ? q.error.message : "Failed to load"}</div>
      </>
    );
  }

  const rows = q.data?.accounts ?? [];

  return (
    <>
      <h1 className={styles.pageTitle}>Accounts</h1>
      <p className={styles.pageSubtitle}>
        Accounts you can access in this workspace.
        {user && canCreateAccount(user.role) && (
          <>
            {" "}
            <Link href="/accounts/new" className={styles.link}>
              New account
            </Link>
          </>
        )}
      </p>
      {rows.length === 0 ? (
        <div className={styles.card}>
          <p className={styles.muted}>No accounts yet.</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {rows.map((a) => (
            <Link key={a.id} href={`/accounts/${a.id}`} className={styles.cardRow}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.costumerName}</div>
                <div className={styles.muted} style={{ fontSize: "0.85rem" }}>
                  {a.costumerEmail}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {a.isHighActivity && <span className={styles.badge}>High activity</span>}
                <span className={styles.badge}>{a.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

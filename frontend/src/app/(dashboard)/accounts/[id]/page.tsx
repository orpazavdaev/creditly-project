"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import type { AccountListItem } from "@/types/api";
import { canOpenAuction } from "@/types/roles";
import { useAuth } from "@/context/auth-context";
import styles from "@/app/ui.module.css";

export default function AccountDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["accounts", API_BASE],
    queryFn: () => apiFetch<{ accounts: AccountListItem[] }>("/accounts"),
  });

  const account = q.data?.accounts.find((a) => a.id === id);

  const createAuction = useMutation({
    mutationFn: () =>
      apiFetch<{ auction: { id: string }; event: { id: string } }>(
        `/accounts/${encodeURIComponent(id)}/auctions`,
        {
          method: "POST",
          json: {},
        }
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["accounts", API_BASE] });
    },
  });

  if (q.isPending) {
    return <p className={styles.muted}>Loading…</p>;
  }

  if (q.isError) {
    return <div className={styles.errorBox}>{q.error instanceof Error ? q.error.message : "Error"}</div>;
  }

  if (!account) {
    return (
      <>
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.muted}>Not found or you do not have access.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={() => router.push("/accounts")}>
            Back to list
          </button>
        </div>
      </>
    );
  }

  const showAuctionCta = user && canOpenAuction(user.role) && account.status === "READY_FOR_AUCTION";

  return (
    <>
      <h1 className={styles.pageTitle}>{account.costumerName}</h1>
      <p className={styles.pageSubtitle}>
        <Link href="/accounts" className={styles.link}>
          ← Accounts
        </Link>
      </p>
      <div className={styles.card}>
        <dl className={styles.dl}>
          <dt className={styles.dt}>Email</dt>
          <dd className={styles.dd}>{account.costumerEmail}</dd>
          <dt className={styles.dt}>Phone</dt>
          <dd className={styles.dd}>{account.costumerPhone}</dd>
          <dt className={styles.dt}>Status</dt>
          <dd className={styles.dd}>{account.status}</dd>
          <dt className={styles.dt}>Last activity</dt>
          <dd className={styles.dd}>{account.lastActivity}</dd>
          <dt className={styles.dt}>CRM sync</dt>
          <dd className={styles.dd}>{account.syncStatus}</dd>
          {account.failureReason && (
            <>
              <dt className={styles.dt}>Failure reason</dt>
              <dd className={styles.dd}>{account.failureReason}</dd>
            </>
          )}
        </dl>
        <div className={styles.actions}>
          <Link href={`/accounts/${account.id}/events`} className={styles.btnSecondary} style={{ display: "inline-block", textAlign: "center" }}>
            View events
          </Link>
          {showAuctionCta && (
            <button
              type="button"
              className={styles.btn}
              disabled={createAuction.isPending}
              onClick={() => createAuction.mutate()}
            >
              {createAuction.isPending ? "Opening…" : "Open auction"}
            </button>
          )}
        </div>
        {createAuction.isError && (
          <div className={styles.errorBox} style={{ marginTop: "1rem", marginBottom: 0 }}>
            {createAuction.error instanceof ApiRequestError
              ? createAuction.error.message
              : "Could not open auction"}
          </div>
        )}
        {createAuction.isSuccess && createAuction.data?.auction?.id && (
          <p className={styles.muted} style={{ marginTop: "1rem" }}>
            Auction created. Bankers can see it under matching specialisation.
          </p>
        )}
      </div>
    </>
  );
}

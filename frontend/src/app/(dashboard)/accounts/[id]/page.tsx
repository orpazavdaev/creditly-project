"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AccountDetailItem } from "@/types/api";
import { SPECIALISATION_VALUES, type Specialisation } from "@/types/domain";
import {
  canManageAuctionForAccount,
  canOpenAuction,
} from "@/types/roles";
import { useAuth } from "@/context/auth-context";
import styles from "@/app/ui.module.css";

export default function AccountDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [classification, setClassification] = useState<Specialisation>(SPECIALISATION_VALUES[0]);

  const q = useQuery({
    queryKey: user ? queryKeys.account(user.id, id) : ["account", id, "pending"],
    queryFn: () => apiFetch<{ account: AccountDetailItem }>(`/accounts/${encodeURIComponent(id)}`),
    enabled: Boolean(id && user),
  });

  const account = q.data?.account;

  const createAuction = useMutation({
    mutationFn: () =>
      apiFetch<{ auction: { id: string }; event: { id: string } }>(
        `/accounts/${encodeURIComponent(id)}/auctions`,
        {
          method: "POST",
          json: { classification },
        }
      ),
    onSuccess: () => {
      if (!user) return;
      void qc.invalidateQueries({ queryKey: queryKeys.accounts(user.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.account(user.id, id) });
      void qc.invalidateQueries({ queryKey: queryKeys.auctions(user.id) });
    },
  });

  const closeAuction = useMutation({
    mutationFn: (auctionId: string) =>
      apiFetch(`/auctions/${encodeURIComponent(auctionId)}/close`, {
        method: "POST",
      }),
    onSuccess: () => {
      if (!user) return;
      void qc.invalidateQueries({ queryKey: queryKeys.accounts(user.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.account(user.id, id) });
      void qc.invalidateQueries({ queryKey: queryKeys.auctions(user.id) });
    },
  });

  const canManageAuction = Boolean(user && account && canManageAuctionForAccount(user, account));

  const showOpenAuction =
    Boolean(user) &&
    canOpenAuction(user!.role) &&
    account?.status === "READY_FOR_AUCTION" &&
    !account.auction &&
    canManageAuction;

  const showCloseAuction =
    Boolean(user && account?.auction && account.auction.canCloseAuction) && canManageAuction;

  if (q.isLoading) {
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

  const auc = account.auction;

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
          {auc && (
            <>
              <dt className={styles.dt}>Auction</dt>
              <dd className={styles.dd}>
                <div>Status: {auc.status}</div>
                <div>Classification: {auc.classification.replace(/_/g, " ")}</div>
                <div>Opened: {new Date(auc.openedAt).toLocaleString()}</div>
                <div>Expires: {new Date(auc.expiresAt).toLocaleString()}</div>
                {auc.closedAt && <div>Closed: {new Date(auc.closedAt).toLocaleString()}</div>}
                {auc.status === "CLOSED" && auc.winningOffer && (
                  <div style={{ marginTop: "0.35rem" }}>
                    Winning offer: {auc.winningOffer.totalInterestRate}% from {auc.winningOffer.bankName}
                  </div>
                )}
              </dd>
            </>
          )}
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
          {showOpenAuction && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <label className={styles.muted} htmlFor="cls">
                Classification
              </label>
              <select
                id="cls"
                className={styles.input}
                style={{ width: "auto", minWidth: "11rem" }}
                value={classification}
                onChange={(e) => setClassification(e.target.value as Specialisation)}
              >
                {SPECIALISATION_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.btn}
                disabled={createAuction.isPending}
                onClick={() => createAuction.mutate()}
              >
                {createAuction.isPending ? "Opening…" : "Open auction"}
              </button>
            </div>
          )}
          {showCloseAuction && auc && (
            <button
              type="button"
              className={styles.btnSecondary}
              disabled={closeAuction.isPending}
              onClick={() => closeAuction.mutate(auc.id)}
            >
              {closeAuction.isPending ? "Closing…" : "Close auction (after expiry)"}
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
        {closeAuction.isError && (
          <div className={styles.errorBox} style={{ marginTop: "1rem", marginBottom: 0 }}>
            {closeAuction.error instanceof ApiRequestError
              ? closeAuction.error.message
              : "Could not close auction"}
          </div>
        )}
        {createAuction.isSuccess && createAuction.data?.auction?.id && (
          <p className={styles.muted} style={{ marginTop: "1rem" }}>
            Auction created. Bankers with matching specialisation can submit offers.
          </p>
        )}
      </div>
    </>
  );
}

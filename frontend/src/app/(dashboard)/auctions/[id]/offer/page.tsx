"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { queryKeys } from "@/lib/query-keys";
import type { AuctionOffersResponse } from "@/types/api";
import styles from "@/app/ui.module.css";

function canSubmitOffer(auction: AuctionOffersResponse["auction"]): boolean {
  if (auction.status !== "OPEN") return false;
  return new Date(auction.expiresAt).getTime() > Date.now();
}

export default function AuctionOfferPage() {
  const params = useParams();
  const auctionId = typeof params.id === "string" ? params.id : "";
  const qc = useQueryClient();
  const { user } = useAuth();
  const [rate, setRate] = useState("3.25");
  const isAdmin = user?.role === "ADMIN";

  const q = useQuery({
    queryKey: user ? queryKeys.auctionOffers(user.id, auctionId) : ["auctionOffers", auctionId, "pending"],
    queryFn: () =>
      apiFetch<AuctionOffersResponse>(`/auctions/${encodeURIComponent(auctionId)}/offers`),
    enabled: Boolean(auctionId && user),
  });

  const submitAllowed = Boolean(
    !isAdmin && user?.role === "BANKER" && q.data && canSubmitOffer(q.data.auction)
  );

  const submit = useMutation({
    mutationFn: () => {
      const n = Number(rate);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid rate");
      return apiFetch(`/auctions/${encodeURIComponent(auctionId)}/offers`, {
        method: "POST",
        json: { totalInterestRate: n },
      });
    },
    onSuccess: () => {
      if (!user) return;
      void qc.invalidateQueries({ queryKey: queryKeys.auctionOffers(user.id, auctionId) });
    },
  });

  if (!auctionId) {
    return <p className={styles.muted}>Invalid auction.</p>;
  }

  if (q.isLoading) {
    return <p className={styles.muted}>Loading auction…</p>;
  }

  if (q.isError) {
    return (
      <>
        <div className={styles.errorBox}>{q.error instanceof Error ? q.error.message : "Failed to load"}</div>
        <Link href={isAdmin ? "/staff-auctions" : "/auctions"} className={styles.link}>
          {isAdmin ? "← All auctions" : "← Auctions"}
        </Link>
      </>
    );
  }

  const data = q.data;
  if (!data) {
    return <p className={styles.muted}>No auction data.</p>;
  }

  const { auction, offers } = data;
  const backHref = isAdmin ? "/staff-auctions" : "/auctions";
  const backLabel = isAdmin ? "← All auctions" : "← Auctions";

  return (
    <>
      <h1 className={styles.pageTitle}>{isAdmin ? "Auction and offers" : "Submit offer"}</h1>
      <p className={styles.pageSubtitle}>
        <Link href={backHref} className={styles.link}>
          {backLabel}
        </Link>
      </p>
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <dl className={styles.dl}>
          <dt className={styles.dt}>Classification</dt>
          <dd className={styles.dd}>{auction.classification.replace(/_/g, " ")}</dd>
          <dt className={styles.dt}>Status</dt>
          <dd className={styles.dd}>{auction.status}</dd>
          <dt className={styles.dt}>Expires</dt>
          <dd className={styles.dd}>{new Date(auction.expiresAt).toLocaleString()}</dd>
          {isAdmin && auction.openedAt && (
            <>
              <dt className={styles.dt}>Opened</dt>
              <dd className={styles.dd}>{new Date(auction.openedAt).toLocaleString()}</dd>
            </>
          )}
          {isAdmin && auction.accountId && (
            <>
              <dt className={styles.dt}>Account</dt>
              <dd className={styles.dd}>
                <Link href={`/accounts/${encodeURIComponent(auction.accountId)}`} className={styles.link}>
                  Open account
                </Link>
              </dd>
            </>
          )}
        </dl>
        {submitAllowed ? (
          <div className={styles.stack} style={{ marginTop: "1rem" }}>
            <label className={styles.label}>
              Total interest rate (%)
              <input className={styles.input} value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
            </label>
            <button type="button" className={styles.btn} disabled={submit.isPending} onClick={() => submit.mutate()}>
              {submit.isPending ? "Submitting…" : "Submit offer"}
            </button>
          </div>
        ) : isAdmin ? (
          <p className={styles.muted} style={{ marginTop: "1rem" }}>
            Viewing all banks&apos; offers (read-only). Submit is available to bankers for matching open auctions.
          </p>
        ) : (
          <p className={styles.muted} style={{ marginTop: "1rem" }}>
            This auction is not accepting new offers.
          </p>
        )}
        {submit.isError && (
          <div className={styles.errorBox} style={{ marginTop: "1rem", marginBottom: 0 }}>
            {submit.error instanceof ApiRequestError
              ? submit.error.message
              : submit.error instanceof Error
                ? submit.error.message
                : "Submit failed"}
          </div>
        )}
      </div>
      <h2 className={styles.pageTitle} style={{ fontSize: "1.1rem" }}>
        {isAdmin ? "All offers (all banks)" : "Your bank's offers"}
      </h2>
      <ul className={styles.cardList}>
        {offers.length === 0 ? (
          <li className={styles.muted}>{isAdmin ? "No offers yet." : "No offers from your bank yet."}</li>
        ) : isAdmin ? (
          offers.map((o) => (
            <li key={o.id} className={styles.cardRow} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.5rem" }}>
                <span style={{ fontWeight: 600 }}>{o.totalInterestRate}%</span>
                <span className={styles.muted} style={{ fontSize: "0.85rem" }}>
                  {new Date(o.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={styles.muted} style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
                {o.bankName ? (
                  <>
                    {o.bankName} · {o.createdByLabel ?? o.bankerId}
                  </>
                ) : (
                  o.bankerId
                )}
              </div>
            </li>
          ))
        ) : (
          offers.map((o) => (
            <li key={o.id} className={styles.cardRow}>
              <span style={{ fontWeight: 600 }}>{o.totalInterestRate}%</span>
              <span className={styles.muted} style={{ fontSize: "0.85rem" }}>
                {new Date(o.createdAt).toLocaleString()}
              </span>
            </li>
          ))
        )}
      </ul>
    </>
  );
}

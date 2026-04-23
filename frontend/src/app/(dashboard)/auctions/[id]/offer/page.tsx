"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { API_BASE } from "@/lib/config";
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
  const [rate, setRate] = useState("3.25");

  const q = useQuery({
    queryKey: ["auctionOffers", API_BASE, auctionId],
    queryFn: () =>
      apiFetch<AuctionOffersResponse>(`/auctions/${encodeURIComponent(auctionId)}/offers`),
    enabled: Boolean(auctionId),
  });

  const submitAllowed = useMemo(() => (q.data ? canSubmitOffer(q.data.auction) : false), [q.data]);

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
      void qc.invalidateQueries({ queryKey: ["auctionOffers", API_BASE, auctionId] });
    },
  });

  if (!auctionId) {
    return <p className={styles.muted}>Invalid auction.</p>;
  }

  if (q.isPending) {
    return <p className={styles.muted}>Loading auction…</p>;
  }

  if (q.isError) {
    return (
      <>
        <div className={styles.errorBox}>{q.error instanceof Error ? q.error.message : "Failed to load"}</div>
        <Link href="/auctions" className={styles.link}>
          ← Auctions
        </Link>
      </>
    );
  }

  const { auction, offers } = q.data;

  return (
    <>
      <h1 className={styles.pageTitle}>Submit offer</h1>
      <p className={styles.pageSubtitle}>
        <Link href="/auctions" className={styles.link}>
          ← Auctions
        </Link>
      </p>
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <dl className={styles.dl}>
          <dt className={styles.dt}>Classification</dt>
          <dd className={styles.dd}>{auction.classification}</dd>
          <dt className={styles.dt}>Status</dt>
          <dd className={styles.dd}>{auction.status}</dd>
          <dt className={styles.dt}>Expires</dt>
          <dd className={styles.dd}>{new Date(auction.expiresAt).toLocaleString()}</dd>
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
        Your bank&apos;s offers
      </h2>
      <ul className={styles.cardList}>
        {offers.length === 0 ? (
          <li className={styles.muted}>No offers from your bank yet.</li>
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

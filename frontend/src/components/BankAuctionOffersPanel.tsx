"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import styles from "@/app/page.module.css";

const base = process.env.NEXT_PUBLIC_API_URL ?? "";

type BankOfferRow = {
  id: string;
  auctionOpportunityId: string;
  bankId: string;
  bankerId: string;
  totalInterestRate: number;
  createdAt: string;
};

type ListResponse = {
  auction: { id: string; status: string; expiresAt: string };
  offers: BankOfferRow[];
};

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function canSubmitOffer(auction: ListResponse["auction"]): boolean {
  if (auction.status !== "OPEN") {
    return false;
  }
  return new Date(auction.expiresAt).getTime() > Date.now();
}

export function BankAuctionOffersPanel() {
  const [auctionId, setAuctionId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [rate, setRate] = useState("3.25");
  const qc = useQueryClient();
  const enabled = Boolean(auctionId.trim() && accessToken.trim());

  const listQuery = useQuery({
    queryKey: ["auctionOffers", base, auctionId.trim(), accessToken.trim()],
    enabled,
    queryFn: async (): Promise<ListResponse> => {
      const res = await fetch(`${base}/auctions/${encodeURIComponent(auctionId.trim())}/offers`, {
        headers: authHeaders(accessToken.trim()),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json() as Promise<ListResponse>;
    },
  });

  const submitAllowed = useMemo(
    () => (listQuery.data ? canSubmitOffer(listQuery.data.auction) : false),
    [listQuery.data]
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      const parsed = Number(rate);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("Invalid rate");
      }
      const res = await fetch(
        `${base}/auctions/${encodeURIComponent(auctionId.trim())}/offers`,
        {
          method: "POST",
          headers: authHeaders(accessToken.trim()),
          body: JSON.stringify({ totalInterestRate: parsed }),
        }
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["auctionOffers", base, auctionId.trim(), accessToken.trim()],
      });
    },
  });

  return (
    <section className={styles.eventsSection}>
      <h2 className={styles.eventsTitle}>Banker auction offers</h2>
      <p className={styles.eventsHint}>
        Uses GET /auctions/:id/offers. Submit is shown only when the auction is OPEN and before
        expiresAt (the API also flips status to EXPIRED after three days).
      </p>
      <label className={styles.eventsLabel}>
        Auction ID
        <input
          className={styles.eventsInput}
          value={auctionId}
          onChange={(e) => setAuctionId(e.target.value)}
          autoComplete="off"
        />
      </label>
      <label className={styles.eventsLabel}>
        Banker access token
        <input
          className={styles.eventsInput}
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          autoComplete="off"
        />
      </label>
      {listQuery.data && (
        <p className={styles.eventsHint}>
          Status: {listQuery.data.auction.status} · Expires: {listQuery.data.auction.expiresAt}
        </p>
      )}
      {submitAllowed && (
        <>
          <label className={styles.eventsLabel}>
            Total interest rate
            <input
              className={styles.eventsInput}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className={styles.eventsButton}
            disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            Submit offer
          </button>
        </>
      )}
      {listQuery.data && !submitAllowed && (
        <p className={styles.eventsHint}>Submit is hidden: auction is not accepting new offers.</p>
      )}
      {submitMutation.isError && (
        <p className={styles.eventsError}>
          {submitMutation.error instanceof Error
            ? submitMutation.error.message
            : "Request failed"}
        </p>
      )}
      {listQuery.isPending && <p>Loading…</p>}
      {listQuery.isError && (
        <p className={styles.eventsError}>
          {listQuery.error instanceof Error ? listQuery.error.message : "Load failed"}
        </p>
      )}
      <ul className={styles.eventsList}>
        {listQuery.data?.offers.map((o) => (
          <li key={o.id} className={styles.eventsListItem}>
            <span className={styles.eventsType}>{o.totalInterestRate}%</span>
            <span className={styles.eventsMeta}>{o.createdAt}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

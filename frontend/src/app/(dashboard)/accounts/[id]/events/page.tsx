"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import type { AccountListItem, EventRow } from "@/types/api";
import styles from "@/app/ui.module.css";

export default function AccountEventsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const accountQ = useQuery({
    queryKey: ["accounts", API_BASE],
    queryFn: () => apiFetch<{ accounts: AccountListItem[] }>("/accounts"),
  });

  const account = accountQ.data?.accounts.find((a) => a.id === id);

  const eventsQ = useQuery({
    queryKey: ["events", API_BASE, id],
    queryFn: () =>
      apiFetch<{ events: EventRow[] }>(`/events?accountId=${encodeURIComponent(id)}`),
    enabled: Boolean(id && account),
  });

  const addNote = useMutation({
    mutationFn: () =>
      apiFetch<{ event: EventRow }>("/events", {
        method: "POST",
        json: {
          accountId: id,
          type: "note_added",
          metadata: { note: note.trim() },
        },
      }),
    onSuccess: () => {
      setNote("");
      void qc.invalidateQueries({ queryKey: ["events", API_BASE, id] });
    },
  });

  if (accountQ.isPending) return <p className={styles.muted}>Loading…</p>;
  if (accountQ.isError) {
    return <div className={styles.errorBox}>{accountQ.error instanceof Error ? accountQ.error.message : "Error"}</div>;
  }
  if (!account) {
    return (
      <>
        <h1 className={styles.pageTitle}>Events</h1>
        <p className={styles.muted}>Account not found.</p>
        <Link href="/accounts" className={styles.link}>
          Back
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Events</h1>
      <p className={styles.pageSubtitle}>
        <Link href={`/accounts/${id}`} className={styles.link}>
          ← {account.costumerName}
        </Link>
      </p>
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <p className={styles.muted} style={{ marginBottom: "0.75rem" }}>
          Add a note (creates a timeline event).
        </p>
        <div className={styles.stack}>
          <textarea
            className={styles.input}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note text"
          />
          <button
            type="button"
            className={styles.btn}
            disabled={!note.trim() || addNote.isPending}
            onClick={() => addNote.mutate()}
          >
            {addNote.isPending ? "Saving…" : "Add note"}
          </button>
        </div>
        {addNote.isError && (
          <div className={styles.errorBox} style={{ marginTop: "0.75rem", marginBottom: 0 }}>
            {addNote.error instanceof ApiRequestError ? addNote.error.message : "Failed"}
          </div>
        )}
      </div>
      {eventsQ.isPending && <p className={styles.muted}>Loading events…</p>}
      {eventsQ.isError && (
        <div className={styles.errorBox}>
          {eventsQ.error instanceof Error ? eventsQ.error.message : "Failed to load events"}
        </div>
      )}
      {eventsQ.data && (
        <ul className={styles.cardList}>
          {eventsQ.data.events.length === 0 ? (
            <li className={styles.muted}>No events yet.</li>
          ) : (
            eventsQ.data.events.map((e) => (
              <li key={e.id} className={styles.cardRow}>
                <span style={{ fontWeight: 600 }}>{e.type}</span>
                <span className={styles.muted} style={{ fontSize: "0.85rem" }}>
                  {e.createdAt}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </>
  );
}

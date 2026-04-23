"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import styles from "@/app/page.module.css";

const base = process.env.NEXT_PUBLIC_API_URL ?? "";

type EventRow = {
  id: string;
  accountId: string;
  userId: string;
  type: string;
  createdAt: string;
  metadata: unknown;
};

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function EventsPanel() {
  const [accountId, setAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [note, setNote] = useState("");
  const qc = useQueryClient();
  const enabled = Boolean(accountId.trim() && accessToken.trim());

  const eventsQuery = useQuery({
    queryKey: ["events", base, accountId.trim(), accessToken.trim()],
    enabled,
    queryFn: async (): Promise<{ events: EventRow[] }> => {
      const url = new URL(`${base}/events`);
      url.searchParams.set("accountId", accountId.trim());
      const res = await fetch(url.toString(), {
        headers: authHeaders(accessToken.trim()),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json() as Promise<{ events: EventRow[] }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: { type: string; metadata?: Record<string, unknown> }) => {
      const res = await fetch(`${base}/events`, {
        method: "POST",
        headers: authHeaders(accessToken.trim()),
        body: JSON.stringify({
          accountId: accountId.trim(),
          type: body.type,
          metadata: body.metadata ?? {},
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json() as Promise<{ event: EventRow }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["events", base, accountId.trim(), accessToken.trim()],
      });
    },
  });

  return (
    <section className={styles.eventsSection}>
      <h2 className={styles.eventsTitle}>Events (simulated)</h2>
      <p className={styles.eventsHint}>
        Set an account id and JWT from login. Upload and note only create events in the API.
      </p>
      <label className={styles.eventsLabel}>
        Account ID
        <input
          className={styles.eventsInput}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          autoComplete="off"
        />
      </label>
      <label className={styles.eventsLabel}>
        Access token
        <input
          className={styles.eventsInput}
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          autoComplete="off"
        />
      </label>
      <div className={styles.eventsActions}>
        <button
          type="button"
          className={styles.eventsButton}
          disabled={!enabled || createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              type: "document_uploaded",
              metadata: { simulated: true },
            })
          }
        >
          Upload Document
        </button>
      </div>
      <label className={styles.eventsLabel}>
        Note
        <textarea
          className={styles.eventsTextarea}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </label>
      <button
        type="button"
        className={styles.eventsButton}
        disabled={!enabled || !note.trim() || createMutation.isPending}
        onClick={() =>
          createMutation.mutate({
            type: "note_added",
            metadata: { note: note.trim() },
          })
        }
      >
        Add Note
      </button>
      {createMutation.isError && (
        <p className={styles.eventsError}>
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : "Request failed"}
        </p>
      )}
      {eventsQuery.isPending && <p>Loading events…</p>}
      {eventsQuery.isError && (
        <p className={styles.eventsError}>
          {eventsQuery.error instanceof Error ? eventsQuery.error.message : "Load failed"}
        </p>
      )}
      {eventsQuery.data?.events.length === 0 && enabled && !eventsQuery.isPending && (
        <p>No events yet.</p>
      )}
      <ul className={styles.eventsList}>
        {eventsQuery.data?.events.map((e) => (
          <li key={e.id} className={styles.eventsListItem}>
            <span className={styles.eventsType}>{e.type}</span>
            <span className={styles.eventsMeta}>{e.createdAt}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

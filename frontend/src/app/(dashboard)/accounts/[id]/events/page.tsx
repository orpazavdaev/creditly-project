"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { queryKeys } from "@/lib/query-keys";
import type { AccountDetailItem, EventRow } from "@/types/api";
import { canRecordDocumentUploadAndNotes } from "@/types/roles";
import styles from "@/app/ui.module.css";

export default function AccountEventsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const qc = useQueryClient();
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const canAct = user ? canRecordDocumentUploadAndNotes(user.role) : false;

  const accountQ = useQuery({
    queryKey: user ? queryKeys.account(user.id, id) : ["account", id, "pending"],
    queryFn: () => apiFetch<{ account: AccountDetailItem }>(`/accounts/${encodeURIComponent(id)}`),
    enabled: Boolean(id && user),
  });

  const account = accountQ.data?.account;

  const eventsQ = useQuery({
    queryKey: user ? queryKeys.events(user.id, id) : ["events", id, "pending"],
    queryFn: () =>
      apiFetch<{ events: EventRow[] }>(`/events?accountId=${encodeURIComponent(id)}`),
    enabled: Boolean(id && user && accountQ.isSuccess && Boolean(accountQ.data?.account)),
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
    onSuccess: async () => {
      if (!user) return;
      setNote("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.events(user.id, id) }),
        qc.invalidateQueries({ queryKey: queryKeys.account(user.id, id) }),
        qc.invalidateQueries({ queryKey: queryKeys.accounts(user.id) }),
      ]);
    },
  });

  const uploadDocument = useMutation({
    mutationFn: () =>
      apiFetch<{ event: EventRow }>("/events", {
        method: "POST",
        json: {
          accountId: id,
          type: "document_uploaded",
          metadata: { source: "ui" },
        },
      }),
    onSuccess: async () => {
      if (!user) return;
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.events(user.id, id) }),
        qc.invalidateQueries({ queryKey: queryKeys.account(user.id, id) }),
        qc.invalidateQueries({ queryKey: queryKeys.accounts(user.id) }),
      ]);
    },
  });

  if (accountQ.isPending) return <p className={styles.muted}>Loading…</p>;
  if (accountQ.isError) {
    return <div className={styles.errorBox}>{getApiErrorMessage(accountQ.error, "Error")}</div>;
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
      {canAct ? (
        <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
          <div className={styles.stack}>
            <div>
              <p className={styles.muted} style={{ marginBottom: "0.5rem" }}>
                Document uploaded
              </p>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={uploadDocument.isPending}
                onClick={() => uploadDocument.mutate()}
              >
                {uploadDocument.isPending ? "Recording…" : "Record document upload"}
              </button>
              {uploadDocument.isError && (
                <div className={styles.errorBox} style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                  {getApiErrorMessage(uploadDocument.error, "Failed")}
                </div>
              )}
            </div>
            <div>
              <p className={styles.muted} style={{ marginBottom: "0.5rem" }}>
                Add a note
              </p>
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
                style={{ marginTop: "0.5rem" }}
                disabled={!note.trim() || addNote.isPending}
                onClick={() => addNote.mutate()}
              >
                {addNote.isPending ? "Saving…" : "Add note"}
              </button>
              {addNote.isError && (
                <div className={styles.errorBox} style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                  {getApiErrorMessage(addNote.error, "Failed")}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className={styles.muted} style={{ marginBottom: "1.25rem" }}>
          Document upload and notes can be added by administrators or assigned users only.
        </p>
      )}
      {eventsQ.isLoading && <p className={styles.muted}>Loading events…</p>}
      {eventsQ.isError && (
        <div className={styles.errorBox}>
          {getApiErrorMessage(eventsQ.error, "Failed to load events")}
        </div>
      )}
      {eventsQ.data && (
        <ul className={styles.cardList}>
          {eventsQ.data.events.length === 0 ? (
            <li className={styles.muted}>No events yet.</li>
          ) : (
            eventsQ.data.events.map((e) => (
              <li key={e.id} className={styles.cardRow}>
                <div>
                  <span style={{ fontWeight: 600 }}>{e.type}</span>
                  <span className={styles.muted} style={{ fontSize: "0.85rem", marginLeft: "0.5rem" }}>
                    by {e.createdByLabel}
                  </span>
                </div>
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, getApiErrorMessage } from "@/lib/api";
import { emailLocalPart } from "@/lib/email-display";
import { queryKeys } from "@/lib/query-keys";
import type { AccountListItem, AssignableUserRow } from "@/types/api";
import styles from "@/app/ui.module.css";

export default function NewAccountPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [costumerName, setCostumerName] = useState("");
  const [costumerEmail, setCostumerEmail] = useState("");
  const [costumerPhone, setCostumerPhone] = useState("");
  const [linkedUserId, setLinkedUserId] = useState("");

  const usersQ = useQuery({
    queryKey: user ? queryKeys.assignableUsers(user.id) : ["users", "assignable", "pending"],
    queryFn: () => apiFetch<{ users: AssignableUserRow[] }>("/users"),
    enabled: Boolean(user),
  });

  const create = useMutation({
    mutationFn: () => {
      const body: {
        costumerName: string;
        costumerEmail: string;
        costumerPhone: string;
        linkedUserId?: string;
      } = {
        costumerName: costumerName.trim(),
        costumerEmail: costumerEmail.trim(),
        costumerPhone: costumerPhone.trim(),
      };
      if (linkedUserId) {
        body.linkedUserId = linkedUserId;
      }
      return apiFetch<{ account: AccountListItem }>("/accounts", {
        method: "POST",
        json: body,
      });
    },
    onSuccess: (data) => {
      if (user) void qc.invalidateQueries({ queryKey: queryKeys.accounts(user.id) });
      router.replace(`/accounts/${data.account.id}`);
    },
  });

  return (
    <>
      <h1 className={styles.pageTitle}>New account</h1>
      <p className={styles.pageSubtitle}>
        <Link href="/accounts" className={styles.link}>
          ← Accounts
        </Link>
      </p>
      <div className={styles.card} style={{ maxWidth: "28rem" }}>
        <p className={styles.muted} style={{ marginBottom: "1rem" }}>
          You will be recorded as the account manager.
        </p>
        <div className={styles.stack}>
          <label className={styles.muted} htmlFor="nm">
            Customer name
          </label>
          <input
            id="nm"
            className={styles.input}
            value={costumerName}
            onChange={(e) => setCostumerName(e.target.value)}
            autoComplete="name"
          />
          <label className={styles.muted} htmlFor="em">
            Email
          </label>
          <input
            id="em"
            type="email"
            className={styles.input}
            value={costumerEmail}
            onChange={(e) => setCostumerEmail(e.target.value)}
            autoComplete="email"
          />
          <label className={styles.muted} htmlFor="ph">
            Phone
          </label>
          <input
            id="ph"
            className={styles.input}
            value={costumerPhone}
            onChange={(e) => setCostumerPhone(e.target.value)}
            autoComplete="tel"
          />
          <label className={styles.muted} htmlFor="uusr">
            Assign to user (optional)
          </label>
          <select
            id="uusr"
            className={styles.input}
            value={linkedUserId}
            onChange={(e) => setLinkedUserId(e.target.value)}
            disabled={usersQ.isLoading || usersQ.isError}
          >
            <option value="">— None —</option>
            {(usersQ.data?.users ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {emailLocalPart(u.email)} · {u.email}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.btn}
            style={{ marginTop: "0.5rem" }}
            disabled={
              create.isPending ||
              !costumerName.trim() ||
              !costumerEmail.trim() ||
              !costumerPhone.trim()
            }
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create account"}
          </button>
        </div>
        {create.isError && (
          <div className={styles.errorBox} style={{ marginTop: "1rem", marginBottom: 0 }}>
            {getApiErrorMessage(create.error, "Could not create")}
          </div>
        )}
      </div>
    </>
  );
}

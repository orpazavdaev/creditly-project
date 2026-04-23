"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, getApiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AccountListItem } from "@/types/api";
import styles from "@/app/ui.module.css";

export default function NewAccountPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [costumerName, setCostumerName] = useState("");
  const [costumerEmail, setCostumerEmail] = useState("");
  const [costumerPhone, setCostumerPhone] = useState("");

  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ account: AccountListItem }>("/accounts", {
        method: "POST",
        json: {
          costumerName: costumerName.trim(),
          costumerEmail: costumerEmail.trim(),
          costumerPhone: costumerPhone.trim(),
        },
      }),
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

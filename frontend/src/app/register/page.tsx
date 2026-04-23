"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { isBankerRole } from "@/types/roles";
import type { RegisterBody } from "@/types/api";
import { USER_ROLE_VALUES, type UserRole } from "@/types/domain";
import styles from "@/app/ui.module.css";

export default function RegisterPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(USER_ROLE_VALUES[1]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(isBankerRole(user.role) ? "/auctions" : "/accounts");
  }, [ready, user, router]);

  return (
    <div className={styles.authCard}>
      <div className={styles.card}>
        <h1 className={styles.pageTitle}>Create account</h1>
        <p className={styles.pageSubtitle}>Pick a role for this demo environment.</p>
        {error && <div className={styles.errorBox}>{error}</div>}
        {done ? (
          <p className={styles.muted}>
            Account created.{" "}
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        ) : (
          <form
            className={styles.stack}
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setPending(true);
              try {
                await apiFetch<{ id: string; email: string; role: UserRole }>("/auth/register", {
                  method: "POST",
                  auth: false,
                  json: { email: email.trim(), password, role } satisfies RegisterBody,
                });
                setDone(true);
              } catch (err) {
                setError(err instanceof ApiRequestError ? err.message : "Registration failed");
              } finally {
                setPending(false);
              }
            }}
          >
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className={styles.label}>
              Password (min 8 characters)
              <input
                className={styles.input}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <label className={styles.label}>
              Role
              <select
                className={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {USER_ROLE_VALUES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className={styles.btn} disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </button>
          </form>
        )}
        <p className={styles.pageSubtitle} style={{ marginTop: "1rem", marginBottom: 0 }}>
          Already registered?{" "}
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ApiRequestError } from "@/lib/api";
import { isBankerRole } from "@/types/roles";
import styles from "@/app/ui.module.css";

export default function LoginPage() {
  const { login, ready, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(isBankerRole(user.role) ? "/auctions" : "/accounts");
  }, [ready, user, router]);

  return (
    <div className={styles.authCard}>
      <div className={styles.card}>
        <h1 className={styles.pageTitle}>Sign in</h1>
        <p className={styles.pageSubtitle}>Use your Creditly account.</p>
        {error && <div className={styles.errorBox}>{error}</div>}
        <form
          className={styles.stack}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setPending(true);
            try {
              await login(email.trim(), password);
              router.replace("/");
            } catch (err) {
              setError(err instanceof ApiRequestError ? err.message : "Sign in failed");
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
            Password
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className={styles.pageSubtitle} style={{ marginTop: "1rem", marginBottom: 0 }}>
          No account?{" "}
          <Link href="/register" className={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

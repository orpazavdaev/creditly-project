"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/types/roles";
import styles from "@/app/ui.module.css";

type RequireAuthProps = {
  children: ReactNode;
  roles?: UserRole[];
};

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(user.role === "BANKER" ? "/auctions" : "/accounts");
    }
  }, [ready, user, roles, router]);

  if (!ready) {
    return (
      <div className={styles.centered}>
        <p className={styles.muted}>Loading session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.centered}>
        <p className={styles.muted}>Redirecting…</p>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className={styles.centered}>
        <p className={styles.muted}>Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}

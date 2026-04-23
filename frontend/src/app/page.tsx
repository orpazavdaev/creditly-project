"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { isBankerRole } from "@/types/roles";
import styles from "@/app/ui.module.css";

export default function HomePage() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(isBankerRole(user.role) ? "/auctions" : "/accounts");
  }, [ready, user, router]);

  return (
    <div className={styles.centered}>
      <p className={styles.muted}>Loading…</p>
    </div>
  );
}

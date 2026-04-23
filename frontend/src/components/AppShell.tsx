"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { isBankerRole, isStaffRole } from "@/types/roles";
import styles from "@/app/ui.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return <>{children}</>;

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`${styles.navLink} ${pathname === href || pathname.startsWith(href + "/") ? styles.navLinkActive : ""}`}
    >
      {label}
    </Link>
  );

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Creditly
        </Link>
        <nav className={styles.nav}>
          {isStaffRole(user.role) && navLink("/accounts", "Accounts")}
          {user.role === "ADMIN" && navLink("/staff-auctions", "Auctions")}
          {isBankerRole(user.role) && navLink("/auctions", "Auctions")}
        </nav>
        <div className={styles.headerRight}>
          <span className={styles.rolePill}>{user.role}</span>
          <span className={styles.email}>{user.email}</span>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

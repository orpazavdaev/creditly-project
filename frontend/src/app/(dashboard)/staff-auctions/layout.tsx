"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import type { UserRole } from "@/types/roles";

const ADMIN_ONLY: UserRole[] = ["ADMIN"];

export default function StaffAuctionsLayout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={ADMIN_ONLY}>{children}</RequireAuth>;
}

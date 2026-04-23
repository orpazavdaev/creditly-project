"use client";

import { RequireAuth } from "@/components/RequireAuth";
import type { UserRole } from "@/types/roles";

const STAFF: UserRole[] = ["ADMIN", "MANAGER", "USER"];

export default function AccountsSectionLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={STAFF}>{children}</RequireAuth>;
}

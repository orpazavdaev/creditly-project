"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import type { UserRole } from "@/types/roles";

const MANAGER_ADMIN: UserRole[] = ["ADMIN", "MANAGER"];

export default function NewAccountLayout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={MANAGER_ADMIN}>{children}</RequireAuth>;
}

"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import type { UserRole } from "@/types/roles";

const EVENTS_VIEWERS: UserRole[] = ["ADMIN", "USER"];

export default function AccountEventsLayout({ children }: { children: ReactNode }) {
  return <RequireAuth roles={EVENTS_VIEWERS}>{children}</RequireAuth>;
}

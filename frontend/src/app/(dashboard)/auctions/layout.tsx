"use client";

import { RequireAuth } from "@/components/RequireAuth";
import type { UserRole } from "@/types/roles";

const BANKER: UserRole[] = ["BANKER"];

export default function AuctionsSectionLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={BANKER}>{children}</RequireAuth>;
}

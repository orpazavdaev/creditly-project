"use client";

import { RequireAuth } from "@/components/RequireAuth";
import type { UserRole } from "@/types/roles";

const AUCTIONS_SECTION_ROLES: UserRole[] = ["BANKER", "ADMIN"];

export default function AuctionsSectionLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={AUCTIONS_SECTION_ROLES}>{children}</RequireAuth>;
}

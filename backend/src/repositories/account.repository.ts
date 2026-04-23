import type { AccountStatus, SyncStatus } from "@prisma/client";
import { prisma } from "./prisma.js";

const staffListSelect = {
  id: true,
  managerId: true,
  costumerEmail: true,
  costumerPhone: true,
  costumerName: true,
  status: true,
  lastActivity: true,
  isHighActivity: true,
  syncStatus: true,
  failureReason: true,
  createdAt: true,
} as const;

export type AccountAccessInfo = {
  id: string;
  managerId: string;
  accountUsers: { userId: string }[];
};

export type AccountStaffListRow = {
  id: string;
  managerId: string;
  costumerEmail: string;
  costumerPhone: string;
  costumerName: string;
  status: AccountStatus;
  lastActivity: Date;
  isHighActivity: boolean;
  syncStatus: SyncStatus;
  failureReason: string | null;
  createdAt: Date;
};

export class AccountRepository {
  findAccessInfoById(accountId: string): Promise<AccountAccessInfo | null> {
    return prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        managerId: true,
        accountUsers: { select: { userId: true } },
      },
    });
  }

  findAllForStaffList(): Promise<AccountStaffListRow[]> {
    return prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      select: staffListSelect,
    });
  }

  findByManagerIdForStaffList(managerId: string): Promise<AccountStaffListRow[]> {
    return prisma.account.findMany({
      where: { managerId },
      orderBy: { createdAt: "desc" },
      select: staffListSelect,
    });
  }

  findByAssignedUserForStaffList(userId: string): Promise<AccountStaffListRow[]> {
    return prisma.account.findMany({
      where: { accountUsers: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      select: staffListSelect,
    });
  }
}

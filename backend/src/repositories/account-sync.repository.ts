import { SyncStatus } from "@prisma/client";
import { prisma } from "./prisma.js";

export class AccountSyncRepository {
  markSuccess(accountId: string): Promise<void> {
    return prisma.account
      .update({
        where: { id: accountId },
        data: { syncStatus: SyncStatus.SUCCESS, failureReason: null },
      })
      .then(() => undefined);
  }

  markFailed(accountId: string, reason: string): Promise<void> {
    return prisma.account
      .update({
        where: { id: accountId },
        data: {
          syncStatus: SyncStatus.FAILED,
          failureReason: reason.slice(0, 2000),
        },
      })
      .then(() => undefined);
  }
}

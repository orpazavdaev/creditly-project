import type { DomainEventCreatedPayload } from "../event-bus/domain-events.js";
import type { WinningOfferSelectedPayload } from "../event-bus/crm-integration-events.js";
import { prisma } from "../repositories/prisma.js";

const CRM_FAILURE_RATE = 0.35;

function shouldFailMock(): boolean {
  return Math.random() < CRM_FAILURE_RATE;
}

export class CrmService {
  private async pushMock(accountId: string, context: string): Promise<void> {
    if (shouldFailMock()) {
      throw new Error(`CRM mock rejected (${context})`);
    }
  }

  private async markSyncFailed(accountId: string, reason: string): Promise<void> {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        syncStatus: "FAILED",
        failureReason: reason.slice(0, 2000),
      },
    });
  }

  private async markSyncOk(accountId: string): Promise<void> {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        syncStatus: "SUCCESS",
        failureReason: null,
      },
    });
  }

  async handleAfterDomainEvent(payload: DomainEventCreatedPayload): Promise<void> {
    const { type, accountId } = payload;
    if (
      type !== "DOCUMENT_UPLOADED" &&
      type !== "STATUS_CHANGED" &&
      type !== "AUCTION_OPENED"
    ) {
      return;
    }
    const ctx = `event:${payload.typeApi}`;
    try {
      await this.pushMock(accountId, ctx);
      await this.markSyncOk(accountId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      try {
        await this.markSyncFailed(accountId, msg);
      } catch (dbErr) {
        const d = dbErr instanceof Error ? dbErr.message : String(dbErr);
        process.stderr.write(`[crm] could not persist failure state: ${d}\n`);
      }
    }
  }

  async handleWinningOfferSelected(payload: WinningOfferSelectedPayload): Promise<void> {
    const ctx = `winning_offer_selected:${payload.offerId}`;
    try {
      await this.pushMock(payload.accountId, ctx);
      await this.markSyncOk(payload.accountId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      try {
        await this.markSyncFailed(payload.accountId, msg);
      } catch (dbErr) {
        const d = dbErr instanceof Error ? dbErr.message : String(dbErr);
        process.stderr.write(`[crm] could not persist failure state: ${d}\n`);
      }
    }
  }
}

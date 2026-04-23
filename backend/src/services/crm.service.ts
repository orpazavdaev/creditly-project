import type { DomainEventCreatedPayload } from "../event-bus/domain-events.js";
import type { WinningOfferSelectedPayload } from "../event-bus/crm-integration-events.js";
import type { AccountSyncRepository } from "../repositories/account-sync.repository.js";

const CRM_FAILURE_RATE = 0.35;

function shouldFailMock(): boolean {
  return Math.random() < CRM_FAILURE_RATE;
}

export class CrmService {
  constructor(private readonly sync: AccountSyncRepository) {}

  private async pushMock(accountId: string, context: string): Promise<void> {
    if (shouldFailMock()) {
      throw new Error(`CRM mock rejected (${context})`);
    }
  }

  async handleAfterDomainEvent(payload: DomainEventCreatedPayload): Promise<void> {
    const { type, accountId } = payload;
    if (
      type !== "DOCUMENT_UPLOADED" &&
      type !== "STATUS_CHANGED" &&
      type !== "AUCTION_OPENED" &&
      type !== "AUCTION_CLOSED"
    ) {
      return;
    }
    const ctx = `event:${payload.typeApi}`;
    try {
      await this.pushMock(accountId, ctx);
      await this.sync.markSuccess(accountId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      try {
        await this.sync.markFailed(accountId, msg);
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
      await this.sync.markSuccess(payload.accountId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      try {
        await this.sync.markFailed(payload.accountId, msg);
      } catch (dbErr) {
        const d = dbErr instanceof Error ? dbErr.message : String(dbErr);
        process.stderr.write(`[crm] could not persist failure state: ${d}\n`);
      }
    }
  }
}

import type { DomainEventCreatedPayload } from "../event-bus/domain-events.js";
import type { WinningOfferSelectedPayload } from "../event-bus/crm-integration-events.js";
import { crmPushMock } from "../integration/crm-mock.js";
import type { AccountSyncRepository } from "../repositories/account-sync.repository.js";

export class CrmService {
  constructor(private readonly sync: AccountSyncRepository) {}

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
      await crmPushMock(accountId, ctx);
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
      await crmPushMock(payload.accountId, ctx);
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

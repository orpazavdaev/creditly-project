import type { EventType } from "@prisma/client";
import type { DomainEventCreatedPayload } from "../event-bus/domain-events.js";
import type { WinningOfferSelectedPayload } from "../event-bus/crm-integration-events.js";
import type { CrmOutboundClient } from "../integration/crm-mock.js";
import type { AccountSyncRepository } from "../repositories/account-sync.repository.js";

const TRIGGER_EVENTS = new Set<EventType>(["DOCUMENT_UPLOADED", "STATUS_CHANGED", "AUCTION_OPENED"]);

export class CrmService {
  constructor(
    private readonly sync: AccountSyncRepository,
    private readonly crmClient: CrmOutboundClient
  ) {}

  async handleAfterDomainEvent(payload: DomainEventCreatedPayload): Promise<void> {
    const { type, accountId } = payload;
    if (!TRIGGER_EVENTS.has(type)) {
      return;
    }
    const ctx = `event:${type}`;
    await this.syncAccount(accountId, ctx);
  }

  async handleWinningOfferSelected(payload: WinningOfferSelectedPayload): Promise<void> {
    const ctx = `winning_offer_selected:${payload.offerId}`;
    await this.syncAccount(payload.accountId, ctx);
  }

  private async syncAccount(accountId: string, ctx: string): Promise<void> {
    try {
      await this.crmClient.push(accountId, ctx);
      await this.sync.markSuccess(accountId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      try {
        await this.sync.markFailed(accountId, msg);
      } catch (dbErr) {
        const d = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error("[crm] could not persist failure state", d);
      }
    }
  }
}

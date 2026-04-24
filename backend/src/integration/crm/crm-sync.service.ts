import { EventType } from "@prisma/client";
import type { AccountEventCreatedPayload } from "../../event-bus/account-events.js";
import type { WinningOfferSelectedPayload } from "../../event-bus/crm-integration-events.js";
import type { AccountSyncRepository } from "../../repositories/account-sync.repository.js";
import type { CrmApiClient } from "./mock-crm-api.client.js";

const TRIGGER_EVENTS = new Set<EventType>([
  EventType.DOCUMENT_UPLOADED,
  EventType.STATUS_CHANGED,
  EventType.AUCTION_OPENED,
]);

export class CrmSyncService {
  constructor(
    private readonly sync: AccountSyncRepository,
    private readonly crmClient: CrmApiClient
  ) {}

  async handleAfterAccountEventCreated(payload: AccountEventCreatedPayload): Promise<void> {
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
      await this.sync.markSynced(accountId);
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

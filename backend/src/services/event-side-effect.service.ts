import { AccountStatus, AuctionOpportunityStatus, EventType } from "@prisma/client";
import type { AccountEventCreatedPayload } from "../event-bus/account-events.js";
import type { EventBus } from "../event-bus/event-bus.js";
import { publishAccountEventCreated } from "../event-bus/publish-account-event.js";
import {
  WINNING_OFFER_SELECTED_TOPIC,
  type WinningOfferSelectedPayload,
} from "../event-bus/crm-integration-events.js";
import { EventSideEffectRepository } from "../repositories/event-side-effect.repository.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export class EventSideEffectService {
  constructor(
    private readonly repo: EventSideEffectRepository,
    private readonly bus: EventBus
  ) {}

  async applyOnEventCreated(payload: AccountEventCreatedPayload): Promise<void> {
    const { type, accountId, userId } = payload;

    if (type === EventType.DOCUMENT_UPLOADED) {
      const changed = await this.repo.updateAccountDocumentState(accountId, new Date());
      if (changed) {
        const statusChanged = await this.repo.createStatusChangedEvent({
          accountId,
          userId,
          fromStatus: AccountStatus.NEW,
          toStatus: AccountStatus.READY_FOR_AUCTION,
        });
        publishAccountEventCreated(this.bus, statusChanged);
      }
    }

    const since = new Date(Date.now() - DAY_MS);
    const count24h = await this.repo.countEventsSince(accountId, since);
    await this.repo.updateAccountHighActivity(accountId, count24h > 3);

    if (type === EventType.AUCTION_CLOSED) {
      const auction = await this.repo.findAuctionWithOffersByAccountId(accountId);
      if (!auction) {
        return;
      }
      if (auction.status === AuctionOpportunityStatus.CLOSED) {
        return;
      }
      if (auction.status === AuctionOpportunityStatus.EXPIRED && auction.bankOffers.length === 0) {
        return;
      }
      const offers = auction.bankOffers;
      const closedAt = new Date();
      if (offers.length === 0) {
        await this.repo.updateAuctionExpired(auction.id, closedAt);
        return;
      }
      const best = offers[0];
      await this.repo.closeAuctionAndMarkAccountWon(auction.id, accountId, best.id, closedAt);
      const statusChanged = await this.repo.createStatusChangedEvent({
        accountId,
        userId,
        fromStatus: AccountStatus.AUCTION_OPEN,
        toStatus: AccountStatus.WON,
        metadata: { auctionId: auction.id, winningOfferId: best.id },
      });
      publishAccountEventCreated(this.bus, statusChanged);
      const winningPayload: WinningOfferSelectedPayload = {
        accountId,
        auctionId: auction.id,
        offerId: best.id,
      };
      this.bus.emit(WINNING_OFFER_SELECTED_TOPIC, winningPayload);
    }
  }
}

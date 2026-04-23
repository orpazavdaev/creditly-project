import type { DomainEventCreatedPayload } from "../event-bus/domain-events.js";
import type { EventBus } from "../event-bus/event-bus.js";
import {
  WINNING_OFFER_SELECTED_TOPIC,
  type WinningOfferSelectedPayload,
} from "../event-bus/crm-integration-events.js";
import { DomainEventBusinessRepository } from "../repositories/domain-event-business.repository.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export class DomainEventBusinessService {
  constructor(
    private readonly repo: DomainEventBusinessRepository,
    private readonly bus: EventBus
  ) {}

  async applyOnEventCreated(payload: DomainEventCreatedPayload): Promise<void> {
    const { type, accountId } = payload;

    if (type === "DOCUMENT_UPLOADED") {
      await this.repo.updateAccountDocumentState(accountId, new Date());
    }

    const since = new Date(Date.now() - DAY_MS);
    const count24h = await this.repo.countEventsSince(accountId, since);
    await this.repo.updateAccountHighActivity(accountId, count24h > 3);

    if (type === "AUCTION_CLOSED") {
      const auction = await this.repo.findAuctionWithOffersByAccountId(accountId);
      if (!auction) {
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
      const winningPayload: WinningOfferSelectedPayload = {
        accountId,
        auctionId: auction.id,
        offerId: best.id,
      };
      this.bus.emit(WINNING_OFFER_SELECTED_TOPIC, winningPayload);
    }
  }
}

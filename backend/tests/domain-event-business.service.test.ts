import { describe, it, expect, vi } from "vitest";
import type { AuctionOpportunity, BankOffer } from "@prisma/client";
import { DomainEventBusinessService } from "../src/services/domain-event-business.service.js";
import type { DomainEventBusinessRepository } from "../src/repositories/domain-event-business.repository.js";
import { WINNING_OFFER_SELECTED_TOPIC } from "../src/event-bus/crm-integration-events.js";
import type { DomainEventCreatedPayload } from "../src/event-bus/domain-events.js";
import type { EventBus } from "../src/event-bus/event-bus.js";

function baseRepo(): Record<keyof DomainEventBusinessRepository, ReturnType<typeof vi.fn>> {
  return {
    updateAccountDocumentState: vi.fn().mockResolvedValue(undefined),
    countEventsSince: vi.fn().mockResolvedValue(0),
    updateAccountHighActivity: vi.fn().mockResolvedValue(undefined),
    findAuctionWithOffersByAccountId: vi.fn().mockResolvedValue(null),
    updateAuctionExpired: vi.fn().mockResolvedValue(undefined),
    closeAuctionAndMarkAccountWon: vi.fn().mockResolvedValue(undefined),
  };
}

describe("DomainEventBusinessService auction close", () => {
  it("selects best offer as lowest totalInterestRate (first in sorted list)", async () => {
    const best: BankOffer = {
      id: "offer-best",
      auctionOpportunityId: "auc1",
      bankId: "b1",
      bankerId: "bk1",
      totalInterestRate: 3.1,
      createdAt: new Date("2026-01-01"),
    };
    const worse: BankOffer = {
      id: "offer-worse",
      auctionOpportunityId: "auc1",
      bankId: "b2",
      bankerId: "bk2",
      totalInterestRate: 4.9,
      createdAt: new Date("2026-01-02"),
    };
    const auction = {
      id: "auc1",
      accountId: "acc1",
      winningOfferId: null,
      classification: "NEW_MORTGAGE" as const,
      status: "OPEN" as const,
      openedBy: "m1",
      openedAt: new Date(),
      expiresAt: new Date(),
      closedAt: null,
      bankOffers: [best, worse],
    } as AuctionOpportunity & { bankOffers: BankOffer[] };

    const repoFns = baseRepo();
    repoFns.findAuctionWithOffersByAccountId.mockResolvedValue(auction);
    const emit = vi.fn();
    const bus = { emit } as unknown as EventBus;
    const svc = new DomainEventBusinessService(repoFns as unknown as DomainEventBusinessRepository, bus);

    const payload: DomainEventCreatedPayload = {
      id: "ev1",
      accountId: "acc1",
      userId: "m1",
      type: "AUCTION_CLOSED",
      typeApi: "auction_closed",
      createdAt: new Date(),
      metadata: {},
    };
    await svc.applyOnEventCreated(payload);

    expect(repoFns.closeAuctionAndMarkAccountWon).toHaveBeenCalledWith(
      "auc1",
      "acc1",
      "offer-best",
      expect.any(Date)
    );
    expect(repoFns.updateAuctionExpired).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(
      WINNING_OFFER_SELECTED_TOPIC,
      expect.objectContaining({
        accountId: "acc1",
        auctionId: "auc1",
        offerId: "offer-best",
      })
    );
  });

  it("expires auction when there are no offers on close", async () => {
    const auction = {
      id: "auc2",
      accountId: "acc2",
      winningOfferId: null,
      classification: "REFINANCE" as const,
      status: "OPEN" as const,
      openedBy: "m1",
      openedAt: new Date(),
      expiresAt: new Date(),
      closedAt: null,
      bankOffers: [],
    } as AuctionOpportunity & { bankOffers: BankOffer[] };

    const repoFns = baseRepo();
    repoFns.findAuctionWithOffersByAccountId.mockResolvedValue(auction);
    const emit = vi.fn();
    const bus = { emit } as unknown as EventBus;
    const svc = new DomainEventBusinessService(repoFns as unknown as DomainEventBusinessRepository, bus);

    const payload: DomainEventCreatedPayload = {
      id: "ev2",
      accountId: "acc2",
      userId: "m1",
      type: "AUCTION_CLOSED",
      typeApi: "auction_closed",
      createdAt: new Date(),
      metadata: {},
    };
    await svc.applyOnEventCreated(payload);

    expect(repoFns.updateAuctionExpired).toHaveBeenCalledWith("auc2", expect.any(Date));
    expect(repoFns.closeAuctionAndMarkAccountWon).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});

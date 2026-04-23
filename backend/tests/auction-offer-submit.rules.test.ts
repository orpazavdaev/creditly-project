import { describe, it, expect, vi } from "vitest";
import { AuctionOfferService } from "../src/services/auction-offer.service.js";
import type { AuctionOfferRepository } from "../src/repositories/auction-offer.repository.js";
import type { AuctionLifecycleRepository } from "../src/repositories/auction-lifecycle.repository.js";
import type { EventBus } from "../src/event-bus/event-bus.js";
import type { DomainEventBusinessService } from "../src/services/domain-event-business.service.js";

describe("AuctionOfferService submitOffer", () => {
  it("rejects when auction is not OPEN", async () => {
    const repo = {
      findBankerForSubmit: vi.fn().mockResolvedValue({
        role: "BANKER",
        bankId: "bank1",
        specialisation: ["NEW_MORTGAGE"],
      }),
      findAuctionById: vi.fn().mockResolvedValue({
        id: "auc1",
        accountId: "acc1",
        status: "EXPIRED",
        expiresAt: new Date(Date.now() - 60_000),
        classification: "NEW_MORTGAGE",
      }),
    } as unknown as AuctionOfferRepository;
    const lifecycle = { expireOpenIfPastDue: vi.fn().mockResolvedValue(undefined) } as unknown as AuctionLifecycleRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const domain = { applyOnEventCreated: vi.fn() } as unknown as DomainEventBusinessService;
    const svc = new AuctionOfferService(repo, lifecycle, bus, domain);

    await expect(svc.submitOffer("bk1", "auc1", { totalInterestRate: 3.5 })).rejects.toMatchObject({
      status: 400,
      code: "auction_not_open",
    });
  });

  it("rejects when auction is past expiresAt", async () => {
    const repo = {
      findBankerForSubmit: vi.fn().mockResolvedValue({
        role: "BANKER",
        bankId: "bank1",
        specialisation: ["NEW_MORTGAGE"],
      }),
      findAuctionById: vi.fn().mockResolvedValue({
        id: "auc1",
        accountId: "acc1",
        status: "OPEN",
        expiresAt: new Date(Date.now() - 1),
        classification: "NEW_MORTGAGE",
      }),
    } as unknown as AuctionOfferRepository;
    const lifecycle = { expireOpenIfPastDue: vi.fn().mockResolvedValue(undefined) } as unknown as AuctionLifecycleRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const domain = { applyOnEventCreated: vi.fn() } as unknown as DomainEventBusinessService;
    const svc = new AuctionOfferService(repo, lifecycle, bus, domain);

    await expect(svc.submitOffer("bk1", "auc1", { totalInterestRate: 3.5 })).rejects.toMatchObject({
      status: 400,
      code: "auction_expired",
    });
  });
});

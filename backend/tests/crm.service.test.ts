import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmSyncService } from "../src/integration/crm/crm-sync.service.js";
import type { AccountSyncRepository } from "../src/repositories/account-sync.repository.js";
import { EventBus } from "../src/event-bus/event-bus.js";
import { registerCrmOnAccountEventCreated } from "../src/event-bus/listeners/crm-on-account-event-created.listener.js";
import { registerCrmWinningOfferListener } from "../src/event-bus/listeners/crm-integration.listener.js";
import { ACCOUNT_EVENT_CREATED } from "../src/event-bus/account-events.js";
import { WINNING_OFFER_SELECTED_TOPIC } from "../src/event-bus/crm-integration-events.js";

describe("CrmSyncService", () => {
  let push: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    push = vi.fn().mockResolvedValue(undefined);
  });

  it("pushes CRM for DOCUMENT_UPLOADED and marks success", async () => {
    const sync = {
      markSynced: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmSyncService(sync, { push });

    await svc.handleAfterAccountEventCreated({
      id: "e1",
      accountId: "acc1",
      userId: "u1",
      type: "DOCUMENT_UPLOADED",
      typeApi: "document_uploaded",
      createdAt: new Date(),
      metadata: {},
    });

    expect(push).toHaveBeenCalledWith("acc1", "event:DOCUMENT_UPLOADED");
    expect(sync.markSynced).toHaveBeenCalledWith("acc1");
    expect(sync.markFailed).not.toHaveBeenCalled();
  });

  it("does not call CRM client for AUCTION_CLOSED (winner path uses winning_offer_selected)", async () => {
    const sync = {
      markSynced: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmSyncService(sync, { push });

    await svc.handleAfterAccountEventCreated({
      id: "e2",
      accountId: "acc1",
      userId: "m1",
      type: "AUCTION_CLOSED",
      typeApi: "auction_closed",
      createdAt: new Date(),
      metadata: {},
    });

    expect(push).not.toHaveBeenCalled();
    expect(sync.markSynced).not.toHaveBeenCalled();
  });

  it("persists failure when CRM client rejects", async () => {
    push.mockRejectedValueOnce(new Error("CRM down"));
    const sync = {
      markSynced: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmSyncService(sync, { push });

    await svc.handleAfterAccountEventCreated({
      id: "e3",
      accountId: "acc2",
      userId: "u1",
      type: "AUCTION_OPENED",
      typeApi: "auction_opened",
      createdAt: new Date(),
      metadata: {},
    });

    expect(sync.markFailed).toHaveBeenCalledWith("acc2", "CRM down");
  });

  it("syncs winning offer via same path as domain events", async () => {
    const sync = {
      markSynced: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmSyncService(sync, { push });

    await svc.handleWinningOfferSelected({
      accountId: "acc9",
      offerId: "offer1",
      auctionId: "auc1",
    });

    expect(push).toHaveBeenCalledWith("acc9", "winning_offer_selected:offer1");
    expect(sync.markSynced).toHaveBeenCalledWith("acc9");
  });
});

describe("EventBus CRM listener wiring", () => {
  it("registerCrmOnAccountEventCreated forwards ACCOUNT_EVENT_CREATED to CrmSyncService", async () => {
    let complete!: () => void;
    const done = new Promise<void>((r) => {
      complete = r;
    });
    const handleAfterAccountEventCreated = vi.fn().mockImplementation(async () => {
      complete();
    });
    const crm = { handleAfterAccountEventCreated } as unknown as CrmSyncService;
    const bus = new EventBus();
    registerCrmOnAccountEventCreated(bus, crm);
    bus.emit(ACCOUNT_EVENT_CREATED, {
      id: "e1",
      accountId: "a1",
      userId: "u1",
      type: "DOCUMENT_UPLOADED",
      typeApi: "document_uploaded",
      createdAt: new Date(),
      metadata: {},
    });
    await done;
    expect(handleAfterAccountEventCreated).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: "a1", type: "DOCUMENT_UPLOADED" })
    );
  });

  it("registerCrmWinningOfferListener forwards topic to handleWinningOfferSelected", async () => {
    let complete!: () => void;
    const done = new Promise<void>((r) => {
      complete = r;
    });
    const handleWinningOfferSelected = vi.fn().mockImplementation(async () => {
      complete();
    });
    const crm = { handleWinningOfferSelected } as unknown as CrmSyncService;
    const bus = new EventBus();
    registerCrmWinningOfferListener(bus, WINNING_OFFER_SELECTED_TOPIC, crm);
    bus.emit(WINNING_OFFER_SELECTED_TOPIC, {
      accountId: "a1",
      offerId: "o1",
      auctionId: "auc1",
    });
    await done;
    expect(handleWinningOfferSelected).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: "a1", offerId: "o1" })
    );
  });
});

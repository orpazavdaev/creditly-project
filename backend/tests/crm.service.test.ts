import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmIntegrationService } from "../src/integration/crm-integration.service.js";
import type { AccountSyncRepository } from "../src/repositories/account-sync.repository.js";

describe("CrmIntegrationService", () => {
  let push: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    push = vi.fn().mockResolvedValue(undefined);
  });

  it("pushes CRM for DOCUMENT_UPLOADED and marks success", async () => {
    const sync = {
      markSynced: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmIntegrationService(sync, { push });

    await svc.handleAfterDomainEvent({
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
    const svc = new CrmIntegrationService(sync, { push });

    await svc.handleAfterDomainEvent({
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
    const svc = new CrmIntegrationService(sync, { push });

    await svc.handleAfterDomainEvent({
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
    const svc = new CrmIntegrationService(sync, { push });

    await svc.handleWinningOfferSelected({
      accountId: "acc9",
      offerId: "offer1",
      auctionId: "auc1",
    });

    expect(push).toHaveBeenCalledWith("acc9", "winning_offer_selected:offer1");
    expect(sync.markSynced).toHaveBeenCalledWith("acc9");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/integration/crm-mock.js", () => ({
  crmPushMock: vi.fn().mockResolvedValue(undefined),
}));

import { crmPushMock } from "../src/integration/crm-mock.js";
import { CrmService } from "../src/services/crm.service.js";
import type { AccountSyncRepository } from "../src/repositories/account-sync.repository.js";

describe("CrmService", () => {
  beforeEach(() => {
    vi.mocked(crmPushMock).mockClear();
    vi.mocked(crmPushMock).mockResolvedValue(undefined);
  });

  it("pushes CRM for DOCUMENT_UPLOADED and marks success", async () => {
    const sync = {
      markSuccess: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmService(sync);

    await svc.handleAfterDomainEvent({
      id: "e1",
      accountId: "acc1",
      userId: "u1",
      type: "DOCUMENT_UPLOADED",
      typeApi: "document_uploaded",
      createdAt: new Date(),
      metadata: {},
    });

    expect(crmPushMock).toHaveBeenCalledWith("acc1", "event:document_uploaded");
    expect(sync.markSuccess).toHaveBeenCalledWith("acc1");
    expect(sync.markFailed).not.toHaveBeenCalled();
  });

  it("does not call CRM mock for AUCTION_CLOSED (winner path uses winning_offer_selected)", async () => {
    const sync = {
      markSuccess: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmService(sync);

    await svc.handleAfterDomainEvent({
      id: "e2",
      accountId: "acc1",
      userId: "m1",
      type: "AUCTION_CLOSED",
      typeApi: "auction_closed",
      createdAt: new Date(),
      metadata: {},
    });

    expect(crmPushMock).not.toHaveBeenCalled();
    expect(sync.markSuccess).not.toHaveBeenCalled();
  });

  it("persists failure when CRM mock rejects", async () => {
    vi.mocked(crmPushMock).mockRejectedValueOnce(new Error("CRM down"));
    const sync = {
      markSuccess: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountSyncRepository;
    const svc = new CrmService(sync);

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
});

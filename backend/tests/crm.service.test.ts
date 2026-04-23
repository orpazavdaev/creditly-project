import { describe, it, expect, vi, afterEach } from "vitest";
import { CrmService } from "../src/services/crm.service.js";
import type { AccountSyncRepository } from "../src/repositories/account-sync.repository.js";
import type { DomainEventCreatedPayload } from "../src/event-bus/domain-events.js";

describe("CrmService failure handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists FAILED sync when mock CRM push rejects", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const markSuccess = vi.fn().mockResolvedValue(undefined);
    const markFailed = vi.fn().mockResolvedValue(undefined);
    const sync = { markSuccess, markFailed } as unknown as AccountSyncRepository;
    const crm = new CrmService(sync);

    const payload: DomainEventCreatedPayload = {
      id: "e1",
      accountId: "acc1",
      userId: "u1",
      type: "DOCUMENT_UPLOADED",
      typeApi: "document_uploaded",
      createdAt: new Date(),
      metadata: {},
    };
    await crm.handleAfterDomainEvent(payload);

    expect(markSuccess).not.toHaveBeenCalled();
    expect(markFailed).toHaveBeenCalledTimes(1);
    expect(markFailed.mock.calls[0][0]).toBe("acc1");
    expect(String(markFailed.mock.calls[0][1])).toContain("CRM mock rejected");
  });

  it("persists SUCCESS when mock CRM push succeeds", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const markSuccess = vi.fn().mockResolvedValue(undefined);
    const markFailed = vi.fn().mockResolvedValue(undefined);
    const sync = { markSuccess, markFailed } as unknown as AccountSyncRepository;
    const crm = new CrmService(sync);

    const payload: DomainEventCreatedPayload = {
      id: "e2",
      accountId: "acc2",
      userId: "u1",
      type: "AUCTION_OPENED",
      typeApi: "auction_opened",
      createdAt: new Date(),
      metadata: {},
    };
    await crm.handleAfterDomainEvent(payload);

    expect(markSuccess).toHaveBeenCalledWith("acc2");
    expect(markFailed).not.toHaveBeenCalled();
  });
});

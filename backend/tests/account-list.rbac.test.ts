import { describe, it, expect, vi } from "vitest";
import { AccountListService } from "../src/services/account-list.service.js";
import type { AccountAccessService } from "../src/services/account-access.service.js";
import type { AccountRepository } from "../src/repositories/account.repository.js";
import type { AuctionLifecycleRepository } from "../src/repositories/auction-lifecycle.repository.js";

describe("AccountListService getById", () => {
  it("rejects BANKER", async () => {
    const repo = {} as unknown as AccountRepository;
    const access = {} as unknown as AccountAccessService;
    const lifecycle = {} as unknown as AuctionLifecycleRepository;
    const svc = new AccountListService(repo, access, lifecycle);
    await expect(
      svc.getById({ id: "b1", email: "b@x.com", role: "BANKER" }, "acc1")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("returns detail after access check", async () => {
    const repo = {
      findStaffDetailById: vi.fn().mockResolvedValue({
        id: "acc1",
        managerId: "m1",
        manager: { email: "mgr@x.com" },
        costumerEmail: "c@x.com",
        costumerPhone: "1",
        costumerName: "Cust",
        status: "NEW",
        lastActivity: new Date(),
        isHighActivity: false,
        syncStatus: "SYNCED",
        failureReason: null,
        createdAt: new Date(),
        auctionOpportunity: null,
      }),
    } as unknown as AccountRepository;
    const assertStaffCanAccessAccount = vi.fn().mockResolvedValue(undefined);
    const access = { assertStaffCanAccessAccount } as unknown as AccountAccessService;
    const lifecycle = {
      expireOpenIfPastDue: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuctionLifecycleRepository;
    const svc = new AccountListService(repo, access, lifecycle);
    const out = await svc.getById({ id: "m1", email: "m@x.com", role: "MANAGER" }, "acc1");
    expect(out.account.id).toBe("acc1");
    expect(out.account.auction).toBeNull();
    expect(assertStaffCanAccessAccount).toHaveBeenCalled();
  });
});

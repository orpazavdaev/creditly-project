import { describe, it, expect, vi } from "vitest";
import { AccountAccessService } from "../src/services/account-access.service.js";
import { HttpError } from "../src/utils/http-error.js";
import type { AccountRepository } from "../src/repositories/account.repository.js";

describe("AccountAccessService RBAC", () => {
  it("rejects BANKER for staff account access", async () => {
    const repo = { findAccessInfoById: vi.fn() } as unknown as AccountRepository;
    const svc = new AccountAccessService(repo);
    await expect(
      svc.assertStaffCanAccessAccount(
        { id: "b1", email: "b@x.com", role: "BANKER" },
        "acc1"
      )
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      svc.assertStaffCanAccessAccount(
        { id: "b1", email: "b@x.com", role: "BANKER" },
        "acc1"
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(repo.findAccessInfoById).not.toHaveBeenCalled();
  });

  it("allows MANAGER only for own accounts", async () => {
    const repo = {
      findAccessInfoById: vi.fn().mockResolvedValue({
        id: "acc1",
        managerId: "m1",
        accountUsers: [],
      }),
    } as unknown as AccountRepository;
    const svc = new AccountAccessService(repo);
    await svc.assertStaffCanAccessAccount(
      { id: "m1", email: "m@x.com", role: "MANAGER" },
      "acc1"
    );
    await expect(
      svc.assertStaffCanAccessAccount(
        { id: "m2", email: "m2@x.com", role: "MANAGER" },
        "acc1"
      )
    ).rejects.toMatchObject({ status: 404 });
  });

  it("allows USER only when assigned", async () => {
    const repo = {
      findAccessInfoById: vi.fn().mockResolvedValue({
        id: "acc1",
        managerId: "m1",
        accountUsers: [{ userId: "u1" }],
      }),
    } as unknown as AccountRepository;
    const svc = new AccountAccessService(repo);
    await svc.assertStaffCanAccessAccount(
      { id: "u1", email: "u@x.com", role: "USER" },
      "acc1"
    );
    await expect(
      svc.assertStaffCanAccessAccount(
        { id: "u2", email: "u2@x.com", role: "USER" },
        "acc1"
      )
    ).rejects.toMatchObject({ status: 404 });
  });

  it("allows ADMIN for any existing account", async () => {
    const repo = {
      findAccessInfoById: vi.fn().mockResolvedValue({
        id: "acc1",
        managerId: "m1",
        accountUsers: [],
      }),
    } as unknown as AccountRepository;
    const svc = new AccountAccessService(repo);
    await svc.assertStaffCanAccessAccount(
      { id: "a1", email: "a@x.com", role: "ADMIN" },
      "acc1"
    );
  });
});

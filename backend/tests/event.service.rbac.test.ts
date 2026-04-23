import { describe, it, expect, vi } from "vitest";
import { EventService } from "../src/services/event.service.js";
import { HttpError } from "../src/utils/http-error.js";
import type { EventRepository } from "../src/repositories/event.repository.js";
import type { EventBus } from "../src/event-bus/event-bus.js";
import type { AccountAccessService } from "../src/services/account-access.service.js";

describe("EventService RBAC for timeline writes", () => {
  it("forbids MANAGER from creating NOTE_ADDED", async () => {
    const repo = { create: vi.fn() } as unknown as EventRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const access = {
      assertStaffCanAccessAccount: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountAccessService;
    const svc = new EventService(repo, bus, access);

    await expect(
      svc.create(
        { id: "m1", email: "m@x.com", role: "MANAGER" },
        { accountId: "acc1", type: "note_added", metadata: { note: "hi" } }
      )
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      svc.create(
        { id: "m1", email: "m@x.com", role: "MANAGER" },
        { accountId: "acc1", type: "note_added", metadata: { note: "hi" } }
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("forbids MANAGER from creating DOCUMENT_UPLOADED", async () => {
    const repo = { create: vi.fn() } as unknown as EventRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const access = {
      assertStaffCanAccessAccount: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountAccessService;
    const svc = new EventService(repo, bus, access);

    await expect(
      svc.create(
        { id: "m1", email: "m@x.com", role: "MANAGER" },
        { accountId: "acc1", type: "document_uploaded", metadata: {} }
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("allows USER to create NOTE_ADDED after access check", async () => {
    const repo = {
      create: vi.fn().mockResolvedValue({
        id: "ev1",
        accountId: "acc1",
        userId: "u1",
        type: "NOTE_ADDED",
        createdAt: new Date(),
        metadata: { note: "x" },
      }),
    } as unknown as EventRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const access = {
      assertStaffCanAccessAccount: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountAccessService;
    const svc = new EventService(repo, bus, access);

    const out = await svc.create(
      { id: "u1", email: "u@x.com", role: "USER" },
      { accountId: "acc1", type: "note_added", metadata: { note: "x" } }
    );
    expect(out.event.type).toBe("note_added");
    expect(repo.create).toHaveBeenCalled();
  });
});

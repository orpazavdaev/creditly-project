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
    expect(out.event.createdByLabel).toBe("u");
    expect(repo.create).toHaveBeenCalled();
  });

  it("forbids MANAGER from listing events", async () => {
    const repo = {
      findByAccountIdWithActor: vi.fn(),
      findByAccountIdWithActorForActorUser: vi.fn(),
    } as unknown as EventRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const access = {
      assertStaffCanAccessAccount: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountAccessService;
    const svc = new EventService(repo, bus, access);

    await expect(svc.listByAccount({ id: "m1", email: "m@x.com", role: "MANAGER" }, "acc1")).rejects.toMatchObject({
      status: 403,
    });
    expect(repo.findByAccountIdWithActor).not.toHaveBeenCalled();
  });

  it("lists only the USER own events for USER role", async () => {
    const rows = [
      {
        id: "e1",
        accountId: "acc1",
        userId: "u1",
        type: "NOTE_ADDED" as const,
        createdAt: new Date(),
        metadata: {},
        user: { email: "u@x.com" },
      },
    ];
    const repo = {
      findByAccountIdWithActor: vi.fn(),
      findByAccountIdWithActorForActorUser: vi.fn().mockResolvedValue(rows),
    } as unknown as EventRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const access = {
      assertStaffCanAccessAccount: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountAccessService;
    const svc = new EventService(repo, bus, access);

    const out = await svc.listByAccount({ id: "u1", email: "u@x.com", role: "USER" }, "acc1");
    expect(out.events).toHaveLength(1);
    expect(repo.findByAccountIdWithActorForActorUser).toHaveBeenCalledWith("acc1", "u1");
    expect(repo.findByAccountIdWithActor).not.toHaveBeenCalled();
  });

  it("lists all account events for ADMIN", async () => {
    const rows = [
      {
        id: "e1",
        accountId: "acc1",
        userId: "u1",
        type: "NOTE_ADDED" as const,
        createdAt: new Date(),
        metadata: {},
        user: { email: "u@x.com" },
      },
      {
        id: "e2",
        accountId: "acc1",
        userId: "u2",
        type: "NOTE_ADDED" as const,
        createdAt: new Date(),
        metadata: {},
        user: { email: "v@x.com" },
      },
    ];
    const repo = {
      findByAccountIdWithActor: vi.fn().mockResolvedValue(rows),
      findByAccountIdWithActorForActorUser: vi.fn(),
    } as unknown as EventRepository;
    const bus = { emit: vi.fn() } as unknown as EventBus;
    const access = {
      assertStaffCanAccessAccount: vi.fn().mockResolvedValue(undefined),
    } as unknown as AccountAccessService;
    const svc = new EventService(repo, bus, access);

    const out = await svc.listByAccount({ id: "a1", email: "a@x.com", role: "ADMIN" }, "acc1");
    expect(out.events).toHaveLength(2);
    expect(repo.findByAccountIdWithActor).toHaveBeenCalledWith("acc1");
    expect(repo.findByAccountIdWithActorForActorUser).not.toHaveBeenCalled();
  });
});

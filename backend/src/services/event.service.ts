import type { Event, Prisma } from "@prisma/client";
import type { EventBus } from "../event-bus/event-bus.js";
import { publishAccountEventCreated, toAccountEventCreatedPayload } from "../event-bus/publish-account-event.js";
import { HttpError } from "../utils/http-error.js";
import { eventTypeToApi, parseEventTypeFromApi } from "../utils/event-type-api.js";
import { EventRepository } from "../repositories/event.repository.js";
import type { AuthUser } from "../types/auth-user.js";
import { AccountAccessService } from "./account-access.service.js";
import { emailLocalPart } from "../utils/email-display.js";
import { parseBody } from "../validation/parse-body.js";
import { EventCreateBodySchema } from "../validation/schemas.js";
import { EventSideEffectService } from "./event-side-effect.service.js";

export type EventApiRow = {
  id: string;
  accountId: string;
  userId: string;
  type: string;
  createdAt: string;
  metadata: unknown;
  createdByLabel: string;
};

export class EventService {
  constructor(
    private readonly repo: EventRepository,
    private readonly bus: EventBus,
    private readonly accountAccess: AccountAccessService,
    private readonly eventSideEffects: EventSideEffectService
  ) {}

  async create(user: AuthUser, body: unknown): Promise<{ event: EventApiRow }> {
    const parsed = parseBody(EventCreateBodySchema, body);
    const { accountId, type } = parsed;
    const metadata = parsed.metadata ?? undefined;
    const prismaType = parseEventTypeFromApi(type);
    if (!prismaType) {
      throw new HttpError(400, "Invalid type", "invalid_type");
    }
    if (user.role !== "ADMIN" && user.role !== "USER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    await this.accountAccess.assertStaffCanAccessAccount(user, accountId);
    let meta: Prisma.InputJsonValue = {};
    if (metadata !== undefined) {
      meta = metadata as Prisma.InputJsonValue;
    }
    const row = await this.repo.create({
      accountId,
      userId: user.id,
      type: prismaType,
      metadata: meta,
    });
    await this.eventSideEffects.applyOnEventCreated(toAccountEventCreatedPayload(row));
    publishAccountEventCreated(this.bus, row);
    return { event: this.toApi(row, user.email) };
  }

  async listByAccount(user: AuthUser, accountId: string): Promise<{ events: EventApiRow[] }> {
    if (user.role !== "ADMIN" && user.role !== "USER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    await this.accountAccess.assertStaffCanAccessAccount(user, accountId);
    const rows =
      user.role === "ADMIN"
        ? await this.repo.findByAccountIdWithActor(accountId)
        : await this.repo.findByAccountIdWithActorForActorUser(accountId, user.id);
    return { events: rows.map((r) => this.toApi(r, r.user.email)) };
  }

  private toApi(row: Event, actorEmail: string): EventApiRow {
    return {
      id: row.id,
      accountId: row.accountId,
      userId: row.userId,
      type: eventTypeToApi(row.type),
      createdAt: row.createdAt.toISOString(),
      metadata: row.metadata,
      createdByLabel: emailLocalPart(actorEmail),
    };
  }
}

import type { Event, Prisma } from "@prisma/client";
import type { EventBus } from "../event-bus/event-bus.js";
import { publishEventCreated } from "../event-bus/publish-domain-event.js";
import { HttpError } from "../utils/http-error.js";
import { API_EVENT_TYPES, eventTypeToApi, parseEventTypeFromApi } from "../utils/event-type-api.js";
import { EventRepository } from "../repositories/event.repository.js";
import type { AuthUser } from "../types/auth-user.js";
import { AccountAccessService } from "./account-access.service.js";

export type EventApiRow = {
  id: string;
  accountId: string;
  userId: string;
  type: string;
  createdAt: string;
  metadata: unknown;
};

export class EventService {
  constructor(
    private readonly repo: EventRepository,
    private readonly bus: EventBus,
    private readonly accountAccess: AccountAccessService
  ) {}

  async create(user: AuthUser, body: unknown): Promise<{ event: EventApiRow }> {
    if (!body || typeof body !== "object") {
      throw new HttpError(400, "Invalid body", "invalid_body");
    }
    const { accountId, type, metadata } = body as Record<string, unknown>;
    if (typeof accountId !== "string" || !accountId) {
      throw new HttpError(400, "accountId is required", "invalid_body");
    }
    if (typeof type !== "string" || !API_EVENT_TYPES.includes(type)) {
      throw new HttpError(400, "Invalid or missing type", "invalid_type");
    }
    const prismaType = parseEventTypeFromApi(type);
    if (!prismaType) {
      throw new HttpError(400, "Invalid type", "invalid_type");
    }
    if (prismaType === "DOCUMENT_UPLOADED" || prismaType === "NOTE_ADDED") {
      if (user.role !== "ADMIN" && user.role !== "USER") {
        throw new HttpError(403, "Forbidden", "forbidden");
      }
    }
    await this.accountAccess.assertStaffCanAccessAccount(user, accountId);
    let meta: Prisma.InputJsonValue = {};
    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata !== "object" || Array.isArray(metadata)) {
        throw new HttpError(400, "metadata must be an object", "invalid_metadata");
      }
      meta = metadata as Prisma.InputJsonValue;
    }
    const row = await this.repo.create({
      accountId,
      userId: user.id,
      type: prismaType,
      metadata: meta,
    });
    publishEventCreated(this.bus, row);
    return { event: this.toApi(row) };
  }

  async listByAccount(user: AuthUser, accountId: string | undefined): Promise<{ events: EventApiRow[] }> {
    if (typeof accountId !== "string" || !accountId) {
      throw new HttpError(400, "accountId query parameter is required", "invalid_query");
    }
    await this.accountAccess.assertStaffCanAccessAccount(user, accountId);
    const rows = await this.repo.findByAccountId(accountId);
    return { events: rows.map((r) => this.toApi(r)) };
  }

  private toApi(row: Event): EventApiRow {
    return {
      id: row.id,
      accountId: row.accountId,
      userId: row.userId,
      type: eventTypeToApi(row.type),
      createdAt: row.createdAt.toISOString(),
      metadata: row.metadata,
    };
  }
}

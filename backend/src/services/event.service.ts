import type { Event, Prisma } from "@prisma/client";
import type { EventBus } from "../event-bus/event-bus.js";
import { DOMAIN_EVENT_CREATED } from "../event-bus/domain-events.js";
import { HttpError } from "../utils/http-error.js";
import { API_EVENT_TYPES, eventTypeToApi, parseEventTypeFromApi } from "../utils/event-type-api.js";
import { EventRepository } from "../repositories/event.repository.js";

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
    private readonly bus: EventBus
  ) {}

  async create(
    userId: string,
    body: unknown
  ): Promise<{ event: EventApiRow }> {
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
    const exists = await this.repo.accountExists(accountId);
    if (!exists) {
      throw new HttpError(404, "Account not found", "account_not_found");
    }
    let meta: Prisma.InputJsonValue = {};
    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata !== "object" || Array.isArray(metadata)) {
        throw new HttpError(400, "metadata must be an object", "invalid_metadata");
      }
      meta = metadata as Prisma.InputJsonValue;
    }
    const row = await this.repo.create({
      accountId,
      userId,
      type: prismaType,
      metadata: meta,
    });
    this.bus.emit(DOMAIN_EVENT_CREATED, {
      id: row.id,
      accountId: row.accountId,
      userId: row.userId,
      type: row.type,
      typeApi: eventTypeToApi(row.type),
      createdAt: row.createdAt,
      metadata: row.metadata,
    });
    return { event: this.toApi(row) };
  }

  async listByAccount(accountId: string | undefined): Promise<{ events: EventApiRow[] }> {
    if (typeof accountId !== "string" || !accountId) {
      throw new HttpError(400, "accountId query parameter is required", "invalid_query");
    }
    const exists = await this.repo.accountExists(accountId);
    if (!exists) {
      throw new HttpError(404, "Account not found", "account_not_found");
    }
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

import { Prisma, type Specialisation } from "@prisma/client";
import type { EventBus } from "../event-bus/event-bus.js";
import { publishEventCreated, toDomainEventCreatedPayload } from "../event-bus/publish-domain-event.js";
import { HttpError } from "../utils/http-error.js";
import { eventTypeToApi } from "../utils/event-type-api.js";
import { AccountAuctionRepository } from "../repositories/account-auction.repository.js";
import type { AuthUser } from "../types/auth-user.js";
import { emailLocalPart } from "../utils/email-display.js";
import { parseBody } from "../validation/parse-body.js";
import { OpenAuctionBodySchema } from "../validation/schemas.js";
import { AccountAccessService } from "./account-access.service.js";
import type { DomainEventBusinessService } from "./domain-event-business.service.js";
import type { EventApiRow } from "./event.service.js";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export type AuctionCreatedApi = {
  id: string;
  accountId: string;
  status: string;
  openedAt: string;
  expiresAt: string;
  classification: string;
  openedBy: string;
};

export class AccountAuctionService {
  constructor(
    private readonly repo: AccountAuctionRepository,
    private readonly bus: EventBus,
    private readonly accountAccess: AccountAccessService,
    private readonly domainEventBusiness: DomainEventBusinessService
  ) {}

  async createForAccount(
    user: AuthUser,
    accountId: string,
    body: unknown
  ): Promise<{ auction: AuctionCreatedApi; event: EventApiRow }> {
    const parsed = parseBody(OpenAuctionBodySchema, body ?? {});
    const classification: Specialisation = parsed.classification;

    await this.accountAccess.assertManagerAdminCanAccessAccount(user, accountId);

    const account = await this.repo.findAccountForAuctionCreate(accountId);
    if (!account) {
      throw new HttpError(404, "Account not found", "account_not_found");
    }
    if (account.status !== "READY_FOR_AUCTION") {
      throw new HttpError(400, "Account must be READY_FOR_AUCTION", "account_not_ready");
    }
    if (account.auctionOpportunity) {
      throw new HttpError(409, "Auction already exists for this account", "auction_exists");
    }

    const openedAt = new Date();
    const expiresAt = new Date(Date.now() + THREE_DAYS_MS);

    try {
      const { auction, eventRow } = await this.repo.createAuctionAndOpenedEvent({
        accountId,
        userId: user.id,
        classification,
        openedAt,
        expiresAt,
      });

      await this.domainEventBusiness.applyOnEventCreated(toDomainEventCreatedPayload(eventRow));
      publishEventCreated(this.bus, eventRow);

      return {
        auction: {
          id: auction.id,
          accountId: auction.accountId,
          status: auction.status,
          openedAt: auction.openedAt.toISOString(),
          expiresAt: auction.expiresAt.toISOString(),
          classification: auction.classification,
          openedBy: auction.openedBy,
        },
        event: {
          id: eventRow.id,
          accountId: eventRow.accountId,
          userId: eventRow.userId,
          type: eventTypeToApi(eventRow.type),
          createdAt: eventRow.createdAt.toISOString(),
          metadata: eventRow.metadata,
          createdByLabel: emailLocalPart(user.email),
        },
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "Auction already exists for this account", "auction_exists");
      }
      throw e;
    }
  }
}

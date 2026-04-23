import { Prisma, type Specialisation } from "@prisma/client";
import type { EventBus } from "../event-bus/event-bus.js";
import { publishEventCreated } from "../event-bus/publish-domain-event.js";
import { HttpError } from "../utils/http-error.js";
import { eventTypeToApi } from "../utils/event-type-api.js";
import { prisma } from "../repositories/prisma.js";
import type { EventApiRow } from "./event.service.js";

const SPECIALISATIONS: Specialisation[] = [
  "NEW_MORTGAGE",
  "REFINANCE",
  "PERSONAL_LOAN",
  "BUSINESS_LOAN",
];

function isSpecialisation(v: unknown): v is Specialisation {
  return typeof v === "string" && SPECIALISATIONS.includes(v as Specialisation);
}

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
  constructor(private readonly bus: EventBus) {}

  async createForAccount(
    userId: string,
    accountId: string,
    body: unknown
  ): Promise<{ auction: AuctionCreatedApi; event: EventApiRow }> {
    let classification: Specialisation = "NEW_MORTGAGE";
    if (body && typeof body === "object") {
      const c = (body as Record<string, unknown>).classification;
      if (c !== undefined) {
        if (!isSpecialisation(c)) {
          throw new HttpError(400, "Invalid classification", "invalid_body");
        }
        classification = c;
      }
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { auctionOpportunity: { select: { id: true } } },
    });
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
      const { auction, eventRow } = await prisma.$transaction(async (tx) => {
        const a = await tx.auctionOpportunity.create({
          data: {
            accountId,
            classification,
            status: "OPEN",
            openedBy: userId,
            openedAt,
            expiresAt,
          },
        });
        const e = await tx.event.create({
          data: {
            accountId,
            userId,
            type: "AUCTION_OPENED",
            metadata: { auctionId: a.id },
          },
        });
        return { auction: a, eventRow: e };
      });

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

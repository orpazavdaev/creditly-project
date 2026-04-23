import { Prisma } from "@prisma/client";
import type { EventBus } from "../event-bus/event-bus.js";
import { publishEventCreated } from "../event-bus/publish-domain-event.js";
import { HttpError } from "../utils/http-error.js";
import { eventTypeToApi } from "../utils/event-type-api.js";
import { AuctionLifecycleRepository } from "../repositories/auction-lifecycle.repository.js";
import { AuctionOfferRepository } from "../repositories/auction-offer.repository.js";
import type { EventApiRow } from "./event.service.js";

export type BankOfferApiRow = {
  id: string;
  auctionOpportunityId: string;
  bankId: string;
  bankerId: string;
  totalInterestRate: number;
  createdAt: string;
};

export type AuctionSummaryApi = {
  id: string;
  status: string;
  expiresAt: string;
};

export class AuctionOfferService {
  constructor(
    private readonly repo: AuctionOfferRepository,
    private readonly lifecycleRepo: AuctionLifecycleRepository,
    private readonly bus: EventBus
  ) {}

  async listOffersForBanker(
    userId: string,
    auctionId: string
  ): Promise<{ auction: AuctionSummaryApi; offers: BankOfferApiRow[] }> {
    const banker = await this.repo.findBankerForList(userId);
    if (!banker || banker.role !== "BANKER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    if (!banker.bankId) {
      throw new HttpError(400, "Banker must belong to a bank", "no_bank");
    }
    const listBankId = banker.bankId;
    await this.lifecycleRepo.expireOpenIfPastDue(auctionId);
    const auction = await this.repo.findAuctionByIdForList(auctionId);
    if (!auction) {
      throw new HttpError(404, "Auction not found", "not_found");
    }
    const offers = await this.repo.findOffersByAuctionAndBank(auctionId, listBankId);
    return {
      auction: {
        id: auction.id,
        status: auction.status,
        expiresAt: auction.expiresAt.toISOString(),
      },
      offers: offers.map((o) => ({
        id: o.id,
        auctionOpportunityId: o.auctionOpportunityId,
        bankId: o.bankId,
        bankerId: o.bankerId,
        totalInterestRate: o.totalInterestRate,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  async submitOffer(
    userId: string,
    auctionId: string,
    body: unknown
  ): Promise<{ offer: BankOfferApiRow; event: EventApiRow }> {
    if (!body || typeof body !== "object") {
      throw new HttpError(400, "Invalid body", "invalid_body");
    }
    const raw = (body as Record<string, unknown>).totalInterestRate;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
      throw new HttpError(400, "totalInterestRate must be a positive number", "invalid_body");
    }
    const totalInterestRate = raw;

    const banker = await this.repo.findBankerForSubmit(userId);
    if (!banker || banker.role !== "BANKER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    if (!banker.bankId) {
      throw new HttpError(400, "Banker must belong to a bank", "no_bank");
    }
    const bankId = banker.bankId;

    await this.lifecycleRepo.expireOpenIfPastDue(auctionId);
    const auction = await this.repo.findAuctionById(auctionId);
    if (!auction) {
      throw new HttpError(404, "Auction not found", "not_found");
    }
    if (auction.status !== "OPEN") {
      throw new HttpError(400, "Auction must be OPEN", "auction_not_open");
    }
    if (auction.expiresAt <= new Date()) {
      throw new HttpError(400, "Auction has expired", "auction_expired");
    }
    if (!banker.specialisation.includes(auction.classification)) {
      throw new HttpError(400, "Banker specialisation does not match auction classification", "ineligible");
    }

    const existing = await this.repo.findOfferByAuctionAndBanker(auctionId, userId);
    if (existing) {
      throw new HttpError(409, "Offer already submitted for this auction", "duplicate_offer");
    }

    try {
      const { offer, eventRow } = await this.repo.createOfferAndSubmittedEvent({
        auctionId,
        accountId: auction.accountId,
        userId,
        bankId,
        totalInterestRate,
      });

      publishEventCreated(this.bus, eventRow);

      return {
        offer: {
          id: offer.id,
          auctionOpportunityId: offer.auctionOpportunityId,
          bankId: offer.bankId,
          bankerId: offer.bankerId,
          totalInterestRate: offer.totalInterestRate,
          createdAt: offer.createdAt.toISOString(),
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
      if (e instanceof HttpError) {
        throw e;
      }
      if (e instanceof Error && e.message === "DUPLICATE_OFFER") {
        throw new HttpError(409, "Offer already submitted for this auction", "duplicate_offer");
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "Offer already submitted for this auction", "duplicate_offer");
      }
      throw e;
    }
  }
}

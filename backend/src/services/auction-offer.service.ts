import { Prisma } from "@prisma/client";
import type { EventBus } from "../event-bus/event-bus.js";
import { publishEventCreated, toDomainEventCreatedPayload } from "../event-bus/publish-domain-event.js";
import { HttpError } from "../utils/http-error.js";
import { emailLocalPart } from "../utils/email-display.js";
import { parseBody } from "../validation/parse-body.js";
import { SubmitOfferBodySchema } from "../validation/schemas.js";
import { eventTypeToApi } from "../utils/event-type-api.js";
import { mapBankerSubmitOfferResponse, type BankerSubmitOfferResponse } from "../mappers/banker-responses.mapper.js";
import { AuctionLifecycleRepository } from "../repositories/auction-lifecycle.repository.js";
import { AuctionOfferRepository } from "../repositories/auction-offer.repository.js";
import type { BankOfferApiRow } from "../types/bank-offer-api.js";
import type { DomainEventBusinessService } from "./domain-event-business.service.js";
import type { AuthUser } from "../types/auth-user.js";
import { effectiveAuctionOpportunityStatus } from "../utils/auction-opportunity-status.js";

export type AuctionSummaryApi = {
  id: string;
  classification: string;
  status: string;
  expiresAt: string;
};

export class AuctionOfferService {
  constructor(
    private readonly repo: AuctionOfferRepository,
    private readonly lifecycleRepo: AuctionLifecycleRepository,
    private readonly bus: EventBus,
    private readonly domainEventBusiness: DomainEventBusinessService
  ) {}

  async listOffers(
    user: AuthUser,
    auctionId: string
  ): Promise<{
    auction: AuctionSummaryApi & { accountId?: string; openedAt?: string };
    offers: Array<BankOfferApiRow & { bankName?: string; createdByLabel?: string }>;
  }> {
    if (user.role === "ADMIN") {
      return this.listOffersForAdmin(auctionId);
    }
    if (user.role === "BANKER") {
      return this.listOffersForBanker(user.id, auctionId);
    }
    throw new HttpError(403, "Forbidden", "forbidden");
  }

  private async listOffersForAdmin(auctionId: string): Promise<{
    auction: AuctionSummaryApi & { accountId: string; openedAt: string };
    offers: Array<BankOfferApiRow & { bankName: string; createdByLabel: string }>;
  }> {
    await this.lifecycleRepo.expireOpenIfPastDue(auctionId);
    const auction = await this.repo.findAuctionByIdForAdminList(auctionId);
    if (!auction) {
      throw new HttpError(404, "Auction not found", "not_found");
    }
    const rows = await this.repo.findAllOffersByAuctionForAdmin(auctionId);
    return {
      auction: {
        id: auction.id,
        classification: auction.classification,
        status: effectiveAuctionOpportunityStatus(auction.status, auction.expiresAt),
        expiresAt: auction.expiresAt.toISOString(),
        accountId: auction.accountId,
        openedAt: auction.openedAt.toISOString(),
      },
      offers: rows.map((o) => ({
        id: o.id,
        auctionOpportunityId: o.auctionOpportunityId,
        bankId: o.bankId,
        bankerId: o.bankerId,
        totalInterestRate: o.totalInterestRate,
        createdAt: o.createdAt.toISOString(),
        bankName: o.bank.name,
        createdByLabel: emailLocalPart(o.banker.email),
      })),
    };
  }

  private async listOffersForBanker(
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
    if (!banker.specialisation.includes(auction.classification)) {
      throw new HttpError(404, "Auction not found", "not_found");
    }
    const offers = await this.repo.findOffersByAuctionAndBank(auctionId, listBankId);
    return {
      auction: {
        id: auction.id,
        classification: auction.classification,
        status: effectiveAuctionOpportunityStatus(auction.status, auction.expiresAt),
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
  ): Promise<BankerSubmitOfferResponse> {
    const { totalInterestRate } = parseBody(SubmitOfferBodySchema, body);

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

      await this.domainEventBusiness.applyOnEventCreated(toDomainEventCreatedPayload(eventRow));
      publishEventCreated(this.bus, eventRow);

      return mapBankerSubmitOfferResponse({
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
          createdByLabel: emailLocalPart(banker.email),
        },
      });
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

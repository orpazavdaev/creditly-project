import type { EventBus } from "../event-bus/event-bus.js";
import { publishEventCreated, toDomainEventCreatedPayload } from "../event-bus/publish-domain-event.js";
import { HttpError } from "../utils/http-error.js";
import { AuctionLifecycleRepository } from "../repositories/auction-lifecycle.repository.js";
import type { AuthUser } from "../types/auth-user.js";
import { AccountAccessService } from "./account-access.service.js";
import { DomainEventBusinessService } from "./domain-event-business.service.js";

export class AuctionCloseService {
  constructor(
    private readonly lifecycleRepo: AuctionLifecycleRepository,
    private readonly bus: EventBus,
    private readonly accountAccess: AccountAccessService,
    private readonly domainEventBusiness: DomainEventBusinessService
  ) {}

  async closeByManager(user: AuthUser, auctionId: string): Promise<{ closed: true }> {
    await this.lifecycleRepo.expireOpenIfPastDue(auctionId);
    const row = await this.lifecycleRepo.findForClose(auctionId);
    if (!row) {
      throw new HttpError(404, "Auction not found", "not_found");
    }
    if (row.status === "CLOSED") {
      throw new HttpError(400, "Auction is already closed", "auction_already_closed");
    }
    const now = new Date();
    if (row.expiresAt > now) {
      throw new HttpError(400, "Auction can only be closed after it has expired", "auction_not_expired");
    }

    await this.accountAccess.assertManagerAdminCanAccessAccount(user, row.accountId);

    if (row.status === "EXPIRED" && row._count.bankOffers === 0) {
      await this.lifecycleRepo.finalizeExpiredWithoutBids(auctionId);
    }

    const eventRow = await this.lifecycleRepo.createAuctionClosedEvent({
      accountId: row.accountId,
      userId: user.id,
      auctionId: row.id,
    });
    await this.domainEventBusiness.applyOnEventCreated(toDomainEventCreatedPayload(eventRow));
    publishEventCreated(this.bus, eventRow);
    return { closed: true };
  }
}

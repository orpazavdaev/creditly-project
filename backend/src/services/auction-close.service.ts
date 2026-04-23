import type { EventBus } from "../event-bus/event-bus.js";
import { publishEventCreated } from "../event-bus/publish-domain-event.js";
import { HttpError } from "../utils/http-error.js";
import { AuctionLifecycleRepository } from "../repositories/auction-lifecycle.repository.js";
import type { AuthUser } from "../types/auth-user.js";
import { AccountAccessService } from "./account-access.service.js";

export class AuctionCloseService {
  constructor(
    private readonly lifecycleRepo: AuctionLifecycleRepository,
    private readonly bus: EventBus,
    private readonly accountAccess: AccountAccessService
  ) {}

  async closeByManager(user: AuthUser, auctionId: string): Promise<{ closed: true }> {
    const row = await this.lifecycleRepo.findForClose(auctionId);
    if (!row) {
      throw new HttpError(404, "Auction not found", "not_found");
    }
    if (row.status === "CLOSED") {
      throw new HttpError(400, "Auction is already closed", "auction_already_closed");
    }
    if (row.status === "EXPIRED" && row._count.bankOffers === 0) {
      throw new HttpError(400, "Auction is already finalized", "auction_already_finalized");
    }

    await this.accountAccess.assertManagerAdminCanAccessAccount(user, row.accountId);

    const eventRow = await this.lifecycleRepo.createAuctionClosedEvent({
      accountId: row.accountId,
      userId: user.id,
      auctionId: row.id,
    });
    publishEventCreated(this.bus, eventRow);
    return { closed: true };
  }
}

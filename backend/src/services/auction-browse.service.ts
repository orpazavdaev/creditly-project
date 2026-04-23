import { HttpError } from "../utils/http-error.js";
import { AuctionBrowseRepository } from "../repositories/auction-browse.repository.js";
import { toAdminAuctionListItem, type AdminAuctionListItem } from "../mappers/admin-auction-list.mapper.js";
import { toBankerAuctionListItem, type BankerAuctionListItem } from "../mappers/banker-auction-list.mapper.js";
import type { AuthUser } from "../types/auth-user.js";

export class AuctionBrowseService {
  constructor(private readonly browseRepo: AuctionBrowseRepository) {}

  async listForUser(
    user: AuthUser
  ): Promise<{ auctions: AdminAuctionListItem[] } | { auctions: BankerAuctionListItem[] }> {
    if (user.role === "ADMIN") {
      const rows = await this.browseRepo.findAll();
      return { auctions: rows.map(toAdminAuctionListItem) };
    }
    if (user.role === "BANKER") {
      const profile = await this.browseRepo.findBankerProfile(user.id);
      if (!profile || profile.role !== "BANKER") {
        throw new HttpError(403, "Forbidden", "forbidden");
      }
      const rows = await this.browseRepo.findRelevantByClassifications(profile.specialisation);
      return { auctions: rows.map(toBankerAuctionListItem) };
    }
    throw new HttpError(403, "Forbidden", "forbidden");
  }
}

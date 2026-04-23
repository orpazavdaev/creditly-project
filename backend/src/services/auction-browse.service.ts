import { HttpError } from "../utils/http-error.js";
import { AuctionBrowseRepository } from "../repositories/auction-browse.repository.js";
import { toBankerAuctionListItem, type BankerAuctionListItem } from "../mappers/banker-auction-list.mapper.js";

export class AuctionBrowseService {
  constructor(private readonly browseRepo: AuctionBrowseRepository) {}

  async listRelevantAuctionsForBanker(userId: string): Promise<{ auctions: BankerAuctionListItem[] }> {
    const profile = await this.browseRepo.findBankerProfile(userId);
    if (!profile || profile.role !== "BANKER") {
      throw new HttpError(403, "Forbidden", "forbidden");
    }
    const rows = await this.browseRepo.findRelevantByClassifications(profile.specialisation);
    return { auctions: rows.map(toBankerAuctionListItem) };
  }
}

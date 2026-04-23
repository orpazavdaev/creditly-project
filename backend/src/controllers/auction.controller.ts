import type { NextFunction, Request, Response } from "express";
import type { AuctionBrowseService } from "../services/auction-browse.service.js";
import type { AuctionCloseService } from "../services/auction-close.service.js";
import { HttpError } from "../utils/http-error.js";
import { parseParams } from "../validation/parse-body.js";
import { PathAuctionIdSchema } from "../validation/schemas.js";

export class AuctionController {
  constructor(
    private readonly closeService: AuctionCloseService,
    private readonly browseService: AuctionBrowseService
  ) {}

  listRelevantForBanker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const out = await this.browseService.listRelevantAuctionsForBanker(req.user.id);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const { id } = parseParams(PathAuctionIdSchema, req.params);
      const out = await this.closeService.closeByManager(req.user, id);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };
}

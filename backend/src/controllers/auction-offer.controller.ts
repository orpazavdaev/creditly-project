import type { NextFunction, Request, Response } from "express";
import type { AuctionOfferService } from "../services/auction-offer.service.js";
import { HttpError } from "../utils/http-error.js";
import { parseParams } from "../validation/parse-body.js";
import { PathAuctionIdSchema } from "../validation/schemas.js";

export class AuctionOfferController {
  constructor(private readonly service: AuctionOfferService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const { id } = parseParams(PathAuctionIdSchema, req.params);
      const out = await this.service.listOffers(req.user, id);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const { id } = parseParams(PathAuctionIdSchema, req.params);
      const out = await this.service.submitOffer(req.user.id, id, req.body);
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  };
}

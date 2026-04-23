import type { NextFunction, Request, Response } from "express";
import type { AuctionOfferService } from "../services/auction-offer.service.js";
import { HttpError } from "../utils/http-error.js";

export class AuctionOfferController {
  constructor(private readonly service: AuctionOfferService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const id = req.params.id;
      if (typeof id !== "string" || !id) {
        next(new HttpError(400, "Invalid auction id", "invalid_params"));
        return;
      }
      const out = await this.service.listOffersForBanker(req.user.id, id);
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
      const id = req.params.id;
      if (typeof id !== "string" || !id) {
        next(new HttpError(400, "Invalid auction id", "invalid_params"));
        return;
      }
      const out = await this.service.submitOffer(req.user.id, id, req.body);
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  };
}

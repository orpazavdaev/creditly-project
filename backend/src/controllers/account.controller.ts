import type { NextFunction, Request, Response } from "express";
import type { AccountAuctionService } from "../services/account-auction.service.js";
import type { AccountListService } from "../services/account-list.service.js";
import { HttpError } from "../utils/http-error.js";

export class AccountController {
  constructor(
    private readonly accountAuction: AccountAuctionService,
    private readonly accountList: AccountListService
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const out = await this.accountList.listForUser(req.user);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };

  createAuctionForAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const id = req.params.id;
      if (typeof id !== "string" || !id) {
        next(new HttpError(400, "Invalid account id", "invalid_params"));
        return;
      }
      const out = await this.accountAuction.createForAccount(req.user, id, req.body);
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  };
}

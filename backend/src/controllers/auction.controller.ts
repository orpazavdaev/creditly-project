import type { NextFunction, Request, Response } from "express";
import type { AuctionCloseService } from "../services/auction-close.service.js";
import { HttpError } from "../utils/http-error.js";

export class AuctionController {
  constructor(private readonly closeService: AuctionCloseService) {}

  create = (_req: Request, res: Response): void => {
    res.status(201).json({ created: true });
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const out = await this.closeService.closeByManager(req.user.id, id);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };
}

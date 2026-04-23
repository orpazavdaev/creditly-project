import type { NextFunction, Request, Response } from "express";
import type { EventService } from "../services/event.service.js";
import { HttpError } from "../utils/http-error.js";

export class EventController {
  constructor(private readonly service: EventService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const out = await this.service.create(req.user, req.body);
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const out = await this.service.listByAccount(
        req.user,
        typeof req.query.accountId === "string" ? req.query.accountId : undefined
      );
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };
}

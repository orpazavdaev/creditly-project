import type { NextFunction, Request, Response } from "express";
import type { AnalyticsService } from "../services/analytics.service.js";
import { HttpError } from "../utils/http-error.js";

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const out = await this.service.getSummary(req.user);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };
}

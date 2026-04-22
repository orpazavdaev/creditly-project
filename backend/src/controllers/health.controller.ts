import type { Request, Response } from "express";
import type { HealthService } from "../services/health.service.js";

export class HealthController {
  constructor(private readonly service: HealthService) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    const body = await this.service.getHealth();
    res.json(body);
  };
}

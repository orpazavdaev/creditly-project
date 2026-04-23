import type { Request, Response } from "express";

export class AuctionController {
  create = (_req: Request, res: Response): void => {
    res.status(201).json({ created: true });
  };
}

import type { Request, Response } from "express";

export class BankOfferController {
  submit = (_req: Request, res: Response): void => {
    res.status(201).json({ submitted: true });
  };
}

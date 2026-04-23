import type { Request, Response } from "express";

export class AccountController {
  list = (_req: Request, res: Response): void => {
    res.status(200).json({ accounts: [] });
  };
}

import type { NextFunction, Request, Response } from "express";
import type { AuthRepository } from "../repositories/auth.repository.js";
import { HttpError } from "../utils/http-error.js";

export class UserController {
  constructor(private readonly authRepo: AuthRepository) {}

  listAssignable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new HttpError(401, "Unauthorized", "unauthorized"));
        return;
      }
      const users = await this.authRepo.findUsersByRole("USER");
      res.status(200).json({ users });
    } catch (e) {
      next(e);
    }
  };
}

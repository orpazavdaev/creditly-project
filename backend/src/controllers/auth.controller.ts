import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.register(req.body);
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.login(req.body, res);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const out = await this.service.refresh(req, res);
      res.status(200).json(out);
    } catch (e) {
      next(e);
    }
  };
}

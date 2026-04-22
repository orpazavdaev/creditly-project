import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  next();
}

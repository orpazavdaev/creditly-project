import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(500).json({ error: "internal_error", message: err.message });
}

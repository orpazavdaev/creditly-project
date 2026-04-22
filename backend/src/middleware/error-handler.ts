import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.code ?? "http_error",
      message: err.message,
    });
    return;
  }
  res.status(500).json({ error: "internal_error", message: err.message });
}

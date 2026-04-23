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
  const log =
    err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ""}` : String(err);
  process.stderr.write(`[error] ${log}\n`);
  res.status(500).json({
    error: "internal_error",
    message: "Something went wrong. Please try again.",
  });
}
